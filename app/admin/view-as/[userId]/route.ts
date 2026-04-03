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

  // 2. Parse and validate userId
  const userId_num = parseInt(userId, 10);
  if (isNaN(userId_num)) {
    return NextResponse.json({ detail: "Invalid user ID" }, { status: 400 });
  }

  // 3. Fetch target user to get email (backend contract compatibility)
  let userEmail: string | null = null;
  try {
    const userResponse = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/proxy/admin/users/${userId_num}`,
      {
        method: "GET",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      }
    );

    if (userResponse.status === 404) {
      return NextResponse.json(
        { detail: "User not found" },
        { status: 404 }
      );
    }

    if (userResponse.ok) {
      const user = await userResponse.json() as { email?: string };
      userEmail = user.email || null;
    }
  } catch (err) {
    console.error("Failed to fetch user:", err);
  }

  if (!userEmail) {
    return NextResponse.json(
      { detail: "Could not load user email" },
      { status: 500 }
    );
  }

  // 4. Create admin_view session with user's email as sub (backend compatibility)
  // sub = email (for /me endpoint)
  // view_as_user_id = numeric ID (for UI display)
  const adminViewToken = signJwt({
    sub: userEmail,
    role: "user",
    mode: "admin_view",
    view_as_user_id: userId_num,
    read_only: true,
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minute TTL
  });

  // 5. Set session cookie and redirect
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
