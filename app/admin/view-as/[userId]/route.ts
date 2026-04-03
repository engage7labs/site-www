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
  try {
    const { userId } = await params;

    // 1. Verify admin session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifyJwt(token) : null;

    if (!session || session.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // 2. Parse and validate userId
    const numericUserId = Number.parseInt(userId, 10);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      return NextResponse.json({ detail: "Invalid userId" }, { status: 400 });
    }

    // 3. Fetch target user through web proxy using request-derived absolute URL
    const userUrl = new URL(
      `/api/proxy/admin/users/${numericUserId}`,
      request.url
    );

    let userResponse: Response;
    try {
      userResponse = await fetch(userUrl, {
        method: "GET",
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      });
    } catch (err) {
      console.error("[admin view-as]", err);
      return NextResponse.json(
        { detail: "Failed to load target user from admin proxy" },
        { status: 502 }
      );
    }

    if (userResponse.status === 404) {
      return NextResponse.json(
        { detail: "Target user not found" },
        { status: 404 }
      );
    }

    if (!userResponse.ok) {
      const upstreamText = await userResponse.text().catch(() => "");
      return NextResponse.json(
        {
          detail: `Failed to load target user (status ${userResponse.status})`,
          upstream: upstreamText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const targetUser = (await userResponse.json().catch(() => null)) as {
      id?: number;
      email?: string;
    } | null;

    if (
      !targetUser ||
      typeof targetUser.email !== "string" ||
      !targetUser.email.trim()
    ) {
      return NextResponse.json(
        { detail: "Target user payload missing email" },
        { status: 500 }
      );
    }

    const targetUserId =
      typeof targetUser.id === "number" && Number.isFinite(targetUser.id)
        ? targetUser.id
        : numericUserId;

    // 4. Preserve current admin-view contract
    const adminViewToken = signJwt({
      sub: targetUser.email,
      role: "user",
      mode: "admin_view",
      view_as_user_id: targetUserId,
      read_only: true,
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    // 5. Set session cookie and redirect
    const response = NextResponse.redirect(new URL("/portal", request.url));
    response.cookies.set(SESSION_COOKIE_NAME, adminViewToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });

    return response;
  } catch (err) {
    console.error("[admin view-as]", err);
    return NextResponse.json(
      { detail: "Unexpected error in admin view-as route" },
      { status: 500 }
    );
  }
}
