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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = body?.access_token;

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    // Verify token with Supabase and get user email
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data?.user?.email) {
      console.error("[magic-callback] Supabase getUser failed:", error?.message);
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

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_30_DAYS,
    });

    return res;
  } catch (err) {
    console.error("[magic-callback] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
