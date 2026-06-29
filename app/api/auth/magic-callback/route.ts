/**
 * POST /api/auth/magic-callback
 *
 * Sprint 30.1: Exchanges a Supabase access_token (from magic link)
 * for our custom JWT session cookie.
 *
 * Called by /auth/callback page after extracting the token from the URL hash.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { SESSION_COOKIE_NAME, signJwt } from "@/lib/auth-server";
import { safeAuthRedirectPath } from "@/lib/auth-redirects";
import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { normalizeLocale } from "@/lib/i18n";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_30_DAYS = 30 * 24 * 3600;
const DEFAULT_REDIRECT_TO = "/portal";
const GOOGLE_SYNC_RETRY_DELAYS_MS = [0, 250, 750] as const;
const TRANSIENT_GOOGLE_SYNC_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function logMagicCallback(event: string, fields: Record<string, unknown> = {}): void {
  // Never log Supabase access/refresh tokens or complete magic-link URLs.
  console.log(JSON.stringify({ event, ...fields }));
}

function emailDomain(email: string): string {
  return email.split("@")[1] ?? "unknown";
}

function isGoogleAuthUser(user: {
  app_metadata?: { provider?: unknown; providers?: unknown };
  identities?: Array<{ provider?: string }> | null;
}): boolean {
  const provider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers;
  return (
    provider === "google" ||
    (Array.isArray(providers) && providers.includes("google")) ||
    Boolean(user.identities?.some((identity) => identity.provider === "google"))
  );
}

async function syncGoogleUser(params: {
  email: string;
  userId: string | undefined;
  preferredLocale: string;
}): Promise<"user" | "admin" | null> {
  const path = "/api/users/sync-authenticated";
  for (const delayMs of GOOGLE_SYNC_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const sigHeaders = signRequest("POST", path);
    const upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body: JSON.stringify({
        email: params.email,
        user_id: params.userId,
        preferred_locale: params.preferredLocale,
        auth_provider: "google",
      }),
    });

    if (upstream.ok) {
      const data = (await upstream.json().catch(() => ({}))) as { role?: string };
      return data.role === "admin" ? "admin" : "user";
    }

    if (upstream.status === 409) {
      const existingRole = await readExistingUserRole(params.email);
      if (existingRole) return existingRole;
    }

    if (!TRANSIENT_GOOGLE_SYNC_STATUSES.has(upstream.status)) return null;
  }

  return readExistingUserRole(params.email);
}

async function readExistingUserRole(email: string): Promise<"user" | "admin" | null> {
  const path = `/api/users/me?email=${encodeURIComponent(email)}`;
  const sigHeaders = signRequest("GET", path);
  const upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ...sigHeaders,
      "X-User-Email": email,
    },
    cache: "no-store",
  });

  if (!upstream.ok) return null;
  const data = (await upstream.json().catch(() => ({}))) as { role?: string };
  return data.role === "admin" ? "admin" : "user";
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  try {
    const body = await request.json();
    const accessToken = body?.access_token;
    const redirectTo = safeAuthRedirectPath(body?.redirect_to ?? DEFAULT_REDIRECT_TO);
    const preferredLocale = normalizeLocale(
      typeof body?.preferred_locale === "string" ? body.preferred_locale : undefined
    );

    logMagicCallback("magic_callback_started", {
      correlation_id: correlationId,
      has_access_token: typeof accessToken === "string" && accessToken.length > 0,
      redirect_to: redirectTo,
    });

    if (!accessToken || typeof accessToken !== "string") {
      logMagicCallback("magic_callback_failed", {
        correlation_id: correlationId,
        reason: "missing_access_token",
      });
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    logMagicCallback("magic_callback_token_found", {
      correlation_id: correlationId,
      token_source: "hash",
    });

    // Verify token with Supabase and get user email
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data?.user?.email) {
      logMagicCallback("magic_callback_failed", {
        correlation_id: correlationId,
        reason: error ? "supabase_user_lookup_failed" : "supabase_user_missing_email",
      });
      return NextResponse.json(
        { error: "Invalid or expired link. Please request a new one." },
        { status: 401 }
      );
    }

    const email = data.user.email;
    let role: "user" | "admin" = "user";

    if (isGoogleAuthUser(data.user)) {
      logMagicCallback("google_callback_sync_started", {
        correlation_id: correlationId,
        email_domain: emailDomain(email),
        redirect_to: redirectTo,
      });
      const syncedRole = await syncGoogleUser({
        email,
        userId: data.user.id,
        preferredLocale,
      }).catch(() => null);

      if (!syncedRole) {
        logMagicCallback("google_callback_sync_failed", {
          correlation_id: correlationId,
          email_domain: emailDomain(email),
        });
        return NextResponse.json(
          {
            error:
              "Could not continue with Google. Please try again or use email.",
            error_code: "google_sync_failed",
          },
          { status: 502 }
        );
      }
      role = syncedRole;
    }

    // Issue our custom JWT session cookie
    const token = signJwt({
      sub: email,
      role,
      exp: Math.floor(Date.now() / 1000) + SESSION_30_DAYS,
    });

    const res = NextResponse.json({ ok: true, redirect_to: redirectTo });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_30_DAYS,
    });

    logMagicCallback("magic_callback_session_created", {
      correlation_id: correlationId,
      email_domain: emailDomain(email),
      role,
    });
    logMagicCallback("magic_callback_redirect", {
      correlation_id: correlationId,
      redirect_to: redirectTo,
    });

    return res;
  } catch (err) {
    logMagicCallback("magic_callback_failed", {
      correlation_id: correlationId,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
