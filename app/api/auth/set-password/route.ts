import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import {
  authenticatedSupabaseClient,
  setSupabaseSessionCookies,
} from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
  const { data, error } = await authenticated.client.auth.updateUser({ password });
  if (error || !data.user) {
    return NextResponse.json(
      { error: "Could not update this sign-in method. Please sign in again." },
      { status: 409 },
    );
  }
  const response = NextResponse.json({ ok: true });
  setSupabaseSessionCookies(response, authenticated.session);
  return response;
}
