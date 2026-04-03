/**
 * POST /admin/view-as/[userId] — Admin view user as read-only
 *
 * Sprint 17.1: Portal Observability
 * Generates temporary admin_view session with user's data
 * TTL: 15 minutes (900 seconds)
 */

import { SESSION_COOKIE_NAME, signJwt, verifyJwt } from "@/lib/auth-server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // 1. Verify admin session
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Create admin_view session
  // Use userId as the subject (not email, for privacy)
  const adminViewToken = signJwt({
    sub: userId,
    role: "user",
    mode: "admin_view",
    read_only: true,
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minute TTL
  });

  // 3. Set session cookie and redirect
  const response = NextResponse.redirect(new URL("/portal", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, adminViewToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900, // 15 minutes
  });

  return response;
}
