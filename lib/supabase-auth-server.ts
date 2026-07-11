import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

export const SUPABASE_ACCESS_COOKIE = "engage7_supabase_access";
export const SUPABASE_REFRESH_COOKIE = "engage7_supabase_refresh";

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) throw new Error("Supabase Auth is not configured");
  return { url, anonKey };
}

export function createSupabaseAuthServerClient(): SupabaseClient {
  const { url, anonKey } = configuration();
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      flowType: "implicit",
    },
  });
}

export async function authenticatedSupabaseClient(request: NextRequest) {
  const accessToken = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken) return null;

  const client = createSupabaseAuthServerClient();
  const { data, error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session) return null;
  return { client, session: data.session };
}

export function setSupabaseSessionCookies(
  response: NextResponse,
  session: Session,
): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(SUPABASE_ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(session.expires_in ?? 3600, 60),
  });
  response.cookies.set(SUPABASE_REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
}

export function clearSupabaseSessionCookies(response: NextResponse): void {
  for (const name of [SUPABASE_ACCESS_COOKIE, SUPABASE_REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}
