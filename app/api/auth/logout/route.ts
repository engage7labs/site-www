import { SESSION_COOKIE_NAME } from "@/lib/auth-server";
import {
  authenticatedSupabaseClient,
  clearSupabaseSessionCookies,
} from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authenticated = await authenticatedSupabaseClient(request).catch(() => null);
  if (authenticated) {
    await authenticated.client.auth.signOut().catch(() => undefined);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  clearSupabaseSessionCookies(res);
  return res;
}
