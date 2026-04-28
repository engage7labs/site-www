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
import { welcomeEmail, sendEmail } from "@/lib/email";
import { generateMagicLink } from "@/lib/supabase-admin";
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

function logStructured(event: string, fields: Record<string, unknown>): void {
  // Single-line JSON so Vercel runtime logs stay greppable.
  // NEVER log Resend keys, Supabase service role, or full magic-link tokens.
  console.log(JSON.stringify({ event, ...fields }));
}

async function deliverWelcomeEmail(email: string): Promise<EmailDelivery> {
  logStructured("magic_link_generation_attempt", { email });
  let magicLink: string | null = null;
  try {
    magicLink = await generateMagicLink(email);
  } catch (err) {
    logStructured("magic_link_generation_failed", {
      email,
      reason: err instanceof Error ? err.message : "unknown",
    });
  }

  if (magicLink) {
    logStructured("magic_link_generation_succeeded", { email });
  } else {
    logStructured("magic_link_generation_failed", {
      email,
      reason: "supabase_returned_null_or_env_missing",
    });
  }

  const accessLink =
    magicLink ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://engage7.ie"}/portal`;

  const template = welcomeEmail(accessLink);

  logStructured("welcome_email_send_attempt", {
    email,
    magic_link_used: Boolean(magicLink),
  });

  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });

  if (result.ok) {
    logStructured("welcome_email_send_succeeded", {
      email,
      magic_link_used: Boolean(magicLink),
    });
    return {
      status: magicLink ? "sent" : "send_failed",
      reason: magicLink ? undefined : "magic_link_unavailable_used_fallback",
      magic_link_used: Boolean(magicLink),
    };
  }

  logStructured("welcome_email_send_failed", {
    email,
    reason: result.error ?? "unknown",
    magic_link_used: Boolean(magicLink),
  });
  return {
    status: magicLink ? "send_failed" : "magic_link_failed",
    reason: result.error ?? "send_failed",
    magic_link_used: Boolean(magicLink),
  };
}

export async function POST(request: NextRequest) {
  const path = "/api/users/create-or-get";
  const sigHeaders = signRequest("POST", path);
  const rawBody = await request.text();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body: rawBody,
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
      emailDelivery = await deliverWelcomeEmail(data.email);
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
