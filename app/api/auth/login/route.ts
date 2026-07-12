import { syncAuthenticatedAppUser } from "@/lib/app-user-sync";
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

    const provider = authUser.identities?.some((identity) => identity.provider === "google")
      ? "google"
      : "email";
    const role = await syncAuthenticatedAppUser({
      userId: authUser.id,
      email: authUser.email,
      provider,
    });
    if (!role) {
      return NextResponse.json(
        { error: "Could not safely resolve this account." },
        { status: 409 },
      );
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
