import { syncAuthenticatedAppUserWithDiagnostics } from "@/lib/app-user-sync";
import {
  SESSION_COOKIE_NAME,
  SESSION_HOURS,
  signJwt,
} from "@/lib/auth-server";
import {
  clearSupabaseSessionCookies,
  createSupabaseAuthServerClient,
  setSupabaseSessionCookies,
} from "@/lib/supabase-auth-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function invalidCredentials() {
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

function identifierSuffix(value: string | null | undefined): string | null {
  return value ? value.slice(-8) : null;
}

function safeSupabaseProjectRef(): string {
  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    const projectRef = hostname.split(".")[0] ?? "";
    return /^[a-z0-9-]{1,64}$/i.test(projectRef) ? projectRef : "unknown";
  } catch {
    return "unknown";
  }
}

function safeRuntimeLabel(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? "";
  return ["dev", "development", "preview", "prod", "production"].includes(normalized)
    ? normalized
    : "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const requireAdmin = body?.admin === true;
    if (!email || !password) return invalidCredentials();

    const supabase = createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    const authUser = data.user;
    const authSession = data.session;
    if (error || !authUser?.id || !authUser.email || !authSession) {
      return invalidCredentials();
    }

    const appUserSync = await syncAuthenticatedAppUserWithDiagnostics({
      accessToken: authSession.access_token,
    });
    const role = appUserSync.role;
    if (!role) {
      return NextResponse.json(
        { error: "Could not safely resolve this account." },
        { status: 409 },
      );
    }

    if (requireAdmin) {
      console.info(JSON.stringify({
        event: "admin_login_authorization_decision",
        environment: safeRuntimeLabel(
          process.env.NEXT_PUBLIC_APP_ENV ??
            process.env.NEXT_PUBLIC_ADMIN_ENV_LABEL ??
            process.env.VERCEL_ENV,
        ),
        vercel_environment: safeRuntimeLabel(process.env.VERCEL_ENV),
        deployed_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
        web_version: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || null,
        supabase_project_ref: safeSupabaseProjectRef(),
        require_admin: true,
        auth_user_id_suffix: identifierSuffix(authUser.id),
        app_user_id_suffix: identifierSuffix(appUserSync.appUserId),
        canonical_ids_match: appUserSync.appUserId
          ? authUser.id === appUserSync.appUserId
          : null,
        app_user_lookup_status: appUserSync.lookupStatus,
        resolved_role: role,
        role_source: appUserSync.roleSource,
        authorization_decision: role === "admin" ? "allow" : "deny",
        failure_stage: appUserSync.failureStage,
      }));
    }

    if (requireAdmin && role !== "admin") {
      const response = NextResponse.json(
        { error: "This account is not authorised for the Admin Portal." },
        { status: 403 },
      );
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      clearSupabaseSessionCookies(response);
      return response;
    }

    const token = signJwt({ sub: authUser.email, user_id: authUser.id, role });
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 3600,
    });
    setSupabaseSessionCookies(response, authSession);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
