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
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_30_DAYS = 30 * 24 * 3600;
const DEFAULT_REDIRECT_TO = "/portal";

function logMagicCallback(event: string, fields: Record<string, unknown> = {}): void {
  // Never log Supabase access/refresh tokens or complete magic-link URLs.
  console.log(JSON.stringify({ event, ...fields }));
}

function safeRedirectTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return DEFAULT_REDIRECT_TO;
  if (value.startsWith("//")) return DEFAULT_REDIRECT_TO;
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = body?.access_token;
    const redirectTo = safeRedirectTo(body?.redirect_to);

    logMagicCallback("magic_callback_started", {
      has_access_token: typeof accessToken === "string" && accessToken.length > 0,
      redirect_to: redirectTo,
    });

    if (!accessToken || typeof accessToken !== "string") {
      logMagicCallback("magic_callback_failed", { reason: "missing_access_token" });
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    logMagicCallback("magic_callback_token_found", { token_source: "hash" });

    // Verify token with Supabase and get user email
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data?.user?.email) {
      logMagicCallback("magic_callback_failed", {
        reason: error?.message ?? "supabase_user_missing_email",
      });
      return NextResponse.json(
        { error: "Invalid or expired link. Please request a new one." },
        { status: 401 }
      );
    }

    const email = data.user.email;

    // Issue our custom JWT session cookie
    const token = signJwt({
      sub: email,
      role: "user",
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

    logMagicCallback("magic_callback_session_created", { email });
    logMagicCallback("magic_callback_redirect", { redirect_to: redirectTo });

    return res;
  } catch (err) {
    logMagicCallback("magic_callback_failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
