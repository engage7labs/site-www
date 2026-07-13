import { syncAuthenticatedAppUser } from "@/lib/app-user-sync";
import { safeAuthRedirectPath } from "@/lib/auth-redirects";
import { SESSION_COOKIE_NAME, signJwt, verifyJwt } from "@/lib/auth-server";
import { normalizeLocale } from "@/lib/i18n";
import { preservesCanonicalUser } from "@/lib/auth-intent";
import { setSupabaseSessionCookies } from "@/lib/supabase-auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Session } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_30_DAYS = 30 * 24 * 3600;

function logCallback(event: string, fields: Record<string, unknown> = {}) {
  // Never log access/refresh/provider tokens or complete callback URLs.
  console.log(JSON.stringify({ event, ...fields }));
}

function providerFor(user: {
  identities?: Array<{ provider?: string }> | null;
}): string {
  return user.identities?.find((identity) => identity.provider)?.provider ?? "email";
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  const body = await request.json().catch(() => null);
  const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
  const refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token : "";
  const redirectTo = safeAuthRedirectPath(body?.redirect_to ?? "/portal");
  const preferredLocale = normalizeLocale(body?.preferred_locale);
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Invalid or expired sign-in." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  const user = data.user;
  if (error || !user?.id || !user.email) {
    return NextResponse.json({ error: "Invalid or expired sign-in." }, { status: 401 });
  }

  const existingAppSession = verifyJwt(
    request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "",
  );
  if (
    existingAppSession?.user_id &&
    existingAppSession.mode !== "admin_view" &&
    !preservesCanonicalUser(existingAppSession.user_id, user.id)
  ) {
    logCallback("auth_callback_identity_mismatch", { correlation_id: correlationId });
    return NextResponse.json(
      {
        error: "This sign-in method is already connected to another Engage7 account.",
        error_code: "identity_mismatch",
      },
      { status: 409 },
    );
  }

  const provider = providerFor(user);
  const role = await syncAuthenticatedAppUser({
    accessToken,
    preferredLocale,
  }).catch(() => null);
  if (!role) {
    logCallback("auth_callback_sync_failed", { correlation_id: correlationId, provider });
    return NextResponse.json(
      {
        error: "Could not safely resolve this account.",
        error_code: "auth_sync_failed",
      },
      { status: 409 },
    );
  }

  const appToken = signJwt({
    sub: user.email,
    user_id: user.id,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_30_DAYS,
  });
  const response = NextResponse.json({ ok: true, redirect_to: redirectTo });
  response.cookies.set(SESSION_COOKIE_NAME, appToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_30_DAYS,
  });
  setSupabaseSessionCookies(response, {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    user,
  } as Session);
  logCallback("auth_callback_session_created", {
    correlation_id: correlationId,
    provider,
  });
  return response;
}
