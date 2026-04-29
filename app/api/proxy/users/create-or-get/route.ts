/**
 * Server-side proxy: POST /api/proxy/users/create-or-get
 *
 * Forwards user creation requests to the API backend.
 * Sprint 15.0: Passwordless user creation with trial plan.
 * Sprint 15.2: Sets session cookie so user lands authenticated in portal.
 * Sprint 30.1: Magic link welcome email (calm UX). Session extended to 30 days.
 *              New users receive a magic link; returning users get a plain portal link.
 * Sprint 37.8: Awaited welcome email + structured Vercel logs + email_delivery
 *              in response so the UI can show calm feedback if Resend/Supabase env
 *              is missing in PROD. No new modal — keep CTA UX from Sprint 37.3.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, signJwt } from "@/lib/auth-server";
import { resolveCanonicalAppUrl } from "@/lib/canonical-app-url";
import { welcomeEmail, sendEmail } from "@/lib/email";
import { ensureSupabaseAuthUser } from "@/lib/supabase-admin";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 30-day session — user should not have to re-authenticate frequently
const SESSION_30_DAYS = 30 * 24 * 3600;

type EmailDeliveryStatus =
  | "sent"
  | "skipped_existing_user"
  | "magic_link_failed"
  | "send_failed"
  | "not_attempted";

interface EmailDelivery {
  status: EmailDeliveryStatus;
  reason?: string;
  magic_link_used: boolean;
}

interface WelcomeAccessLink {
  url: string;
  expiresAt: number;
}

function logStructured(event: string, fields: Record<string, unknown>): void {
  // Single-line JSON so Vercel runtime logs stay greppable.
  // NEVER log Resend keys, Supabase service role, or full magic-link tokens.
  console.log(JSON.stringify({ event, ...fields }));
}

function createWelcomeAccessLink(email: string, userId?: string): WelcomeAccessLink {
  const appUrl = resolveCanonicalAppUrl();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 24 * 3600;
  const token = signJwt({
    sub: email,
    role: "user",
    purpose: "welcome_access",
    user_id: userId,
    exp: expiresAt,
  } as Parameters<typeof signJwt>[0] & {
    purpose: string;
    user_id?: string;
  });

  logStructured("welcome_access_token_created", {
    email,
    has_user_id: Boolean(userId),
    app_url_source: appUrl.source,
    expires_in_seconds: expiresAt - now,
  });

  return {
    url: `${appUrl.appUrl}/auth/welcome?token=${encodeURIComponent(token)}`,
    expiresAt,
  };
}

async function deliverWelcomeEmail(
  email: string,
  userId?: string
): Promise<EmailDelivery> {
  const accessLink = createWelcomeAccessLink(email, userId);
  const template = welcomeEmail(accessLink.url);

  logStructured("welcome_email_send_attempt", {
    email,
    magic_link_used: false,
    access_link_used: true,
  });

  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });

  if (result.ok) {
    logStructured("welcome_email_send_succeeded", {
      email,
      magic_link_used: false,
      access_link_used: true,
    });
    return {
      status: "sent",
      magic_link_used: false,
    };
  }

  logStructured("welcome_email_send_failed", {
    email,
    reason: result.error ?? "unknown",
    provider: result.provider ?? "resend",
    provider_status: result.providerStatus,
    sender_domain: result.senderDomain,
    magic_link_used: false,
    access_link_used: true,
  });
  return {
    status: "send_failed",
    reason: result.error ?? "send_failed",
    magic_link_used: false,
  };
}

export async function POST(request: NextRequest) {
  const path = "/api/users/create-or-get";
  const sigHeaders = signRequest("POST", path);
  const rawBody = await request.text();
  let forwardedBody = rawBody;

  try {
    const parsed = JSON.parse(rawBody) as { email?: unknown; user_id?: unknown };
    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";

    if (email && typeof parsed.user_id !== "string") {
      logStructured("unlock_supabase_auth_user_resolve_attempt", { email });
      const authUser = await ensureSupabaseAuthUser(email);
      if (!authUser.ok || !authUser.userId) {
        logStructured("unlock_supabase_auth_user_resolve_failed", {
          email,
          reason: authUser.reason ?? "unknown",
        });
        return NextResponse.json(
          {
            detail:
              "Authentication service unavailable. Please try again before opening your dashboard.",
          },
          { status: 503 }
        );
      }

      logStructured("unlock_supabase_auth_user_resolve_succeeded", {
        email,
        auth_user_created: authUser.created === true,
      });
      forwardedBody = JSON.stringify({ ...parsed, user_id: authUser.userId });
    }
  } catch {
    // Let the API return its existing validation response for malformed JSON.
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body: forwardedBody,
    });
  } catch {
    return NextResponse.json(
      { detail: "User service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  logStructured("unlock_create_or_get_received", {
    upstream_status: upstreamResponse.status,
    has_email: Boolean(data?.email),
    plan: data?.plan,
  });

  let emailDelivery: EmailDelivery = {
    status: "not_attempted",
    magic_link_used: false,
  };

  if (upstreamResponse.ok && data.email) {
    const isNewUser = data.plan === "trial_start";
    logStructured("unlock_user_created_or_found", {
      email: data.email,
      plan: data.plan,
      is_new_user: isNewUser,
    });

    if (isNewUser) {
      const userId = typeof data.id === "string" ? data.id : undefined;
      emailDelivery = await deliverWelcomeEmail(data.email, userId);
    } else {
      emailDelivery = {
        status: "skipped_existing_user",
        magic_link_used: false,
      };
      logStructured("welcome_email_skipped_existing_user", {
        email: data.email,
      });
    }
  }

  const responseBody =
    upstreamResponse.ok && data.email
      ? { ...data, email_delivery: emailDelivery }
      : data;

  const res = NextResponse.json(responseBody, {
    status: upstreamResponse.status,
  });

  if (upstreamResponse.ok && data.email) {
    const token = signJwt({
      sub: data.email,
      role: "user",
      exp: Math.floor(Date.now() / 1000) + SESSION_30_DAYS,
    });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_30_DAYS,
    });
  }

  return res;
}
