import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { PASSWORD_ENABLED_METADATA_KEY } from "@/lib/password-method-status";
import { classifyPasswordUpdateFailure } from "@/lib/password-update-error";
import {
  authenticatedSupabaseClient,
  setSupabaseSessionCookies,
} from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function identifierSuffix(value: string | null | undefined): string | null {
  return value ? value.slice(-8) : null;
}

function safeSymbol(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9_.-]{1,64}$/.test(normalized) ? normalized : "unknown";
}

export async function POST(request: NextRequest) {
  const appSession = verifyJwt(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "");
  if (!appSession?.user_id || appSession.mode === "admin_view") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 422 },
    );
  }

  const authenticated = await authenticatedSupabaseClient(request);
  if (!authenticated || authenticated.session.user.id !== appSession.user_id) {
    return NextResponse.json(
      { error: "Please sign in again before changing sign-in methods." },
      { status: 401 },
    );
  }
  let { data, error } = await authenticated.client.auth.updateUser({
    password,
    data: { [PASSWORD_ENABLED_METADATA_KEY]: true },
  });
  if (error?.code === "same_password") {
    const markerUpdate = await authenticated.client.auth.updateUser({
      data: { [PASSWORD_ENABLED_METADATA_KEY]: true },
    });
    data = markerUpdate.data;
    error = markerUpdate.error;
  }
  const providers = Array.from(
    new Set(
      (authenticated.session.user.identities ?? [])
        .map((identity) => safeSymbol(identity.provider))
        .filter((provider): provider is string => Boolean(provider)),
    ),
  );
  console.info(JSON.stringify({
    event: "access_code_update_decision",
    environment: safeSymbol(
      process.env.NEXT_PUBLIC_APP_ENV ?? process.env.VERCEL_ENV,
    ),
    supabase_project_ref: (() => {
      try {
        return safeSymbol(
          new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0],
        );
      } catch {
        return "unknown";
      }
    })(),
    auth_user_id_suffix: identifierSuffix(authenticated.session.user.id),
    app_user_id_suffix: identifierSuffix(appSession.user_id),
    canonical_ids_match:
      authenticated.session.user.id === appSession.user_id,
    supabase_session_status: "present",
    providers,
    password_update_status: error || !data.user ? "error" : "success",
    supabase_error_code: safeSymbol(error?.code),
    supabase_error_status:
      typeof error?.status === "number" ? error.status : null,
    authorization_decision: error || !data.user ? "deny" : "allow",
    failure_stage: error || !data.user ? "supabase_update_user" : null,
  }));
  if (error || !data.user) {
    const failure = classifyPasswordUpdateFailure(error);
    return NextResponse.json(
      {
        error:
          failure.errorCode === "weak_password"
            ? "This access code does not meet the security requirements."
            : "Could not update this sign-in method. Please sign in again.",
        error_code: failure.errorCode,
      },
      { status: failure.status },
    );
  }
  const response = NextResponse.json({ ok: true });
  setSupabaseSessionCookies(response, authenticated.session);
  return response;
}
