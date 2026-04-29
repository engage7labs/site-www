/**
 * GET /auth/welcome
 *
 * Engage7-owned welcome access link. Replaces Supabase verify/action_link
 * usage in welcome emails so users land in the portal via the normal
 * Engage7 httpOnly session cookie.
 */

import { SESSION_COOKIE_NAME, signJwt, verifyJwt } from "@/lib/auth-server";
import { findAuthUserIdByEmail } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_30_DAYS = 30 * 24 * 3600;
const PORTAL_PATH = "/portal";
const LOGIN_PATH = "/login";

function logWelcomeAccess(
  event: string,
  fields: Record<string, unknown> = {}
): void {
  // Never log full welcome tokens, JWTs, action links, or URL fragments.
  console.log(JSON.stringify({ event, ...fields }));
}

function redirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  logWelcomeAccess("welcome_access_started", {
    has_token: token.length > 0,
  });

  if (!token) {
    logWelcomeAccess("welcome_access_failed", { reason: "missing_token" });
    return NextResponse.redirect(redirectUrl(request, LOGIN_PATH));
  }

  const payload = verifyJwt(token);
  const purpose = (payload as Record<string, unknown> | null)?.purpose;
  const tokenUserId = (payload as Record<string, unknown> | null)?.user_id;

  if (!payload?.sub || purpose !== "welcome_access") {
    logWelcomeAccess("welcome_access_failed", {
      reason: "invalid_or_expired_token",
      purpose_valid: purpose === "welcome_access",
    });
    return NextResponse.redirect(redirectUrl(request, LOGIN_PATH));
  }

  const email = payload.sub.trim().toLowerCase();
  const authUserId = await findAuthUserIdByEmail(email);
  if (!authUserId) {
    logWelcomeAccess("welcome_access_failed", {
      reason: "user_not_found",
      email,
    });
    return NextResponse.redirect(redirectUrl(request, LOGIN_PATH));
  }

  if (typeof tokenUserId === "string" && tokenUserId && tokenUserId !== authUserId) {
    logWelcomeAccess("welcome_access_failed", {
      reason: "user_id_mismatch",
      email,
    });
    return NextResponse.redirect(redirectUrl(request, LOGIN_PATH));
  }

  logWelcomeAccess("welcome_access_token_valid", {
    email,
    has_user_id: Boolean(authUserId),
  });

  const sessionToken = signJwt({
    sub: email,
    role: "user",
    exp: Math.floor(Date.now() / 1000) + SESSION_30_DAYS,
  });

  const response = NextResponse.redirect(redirectUrl(request, PORTAL_PATH));
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_30_DAYS,
  });

  logWelcomeAccess("welcome_access_session_created", { email });
  logWelcomeAccess("welcome_access_redirect", { redirect_to: PORTAL_PATH });

  return response;
}
