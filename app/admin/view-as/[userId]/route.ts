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

interface AdminUserSummary {
  id?: string;
  email?: string;
}

interface AdminUsersResponse {
  users?: AdminUserSummary[];
}

function logAdminViewAs(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {}
) {
  console.log(JSON.stringify({ event, ...fields }));
}

async function readJsonOrText(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.slice(0, 500);
  }
}

function getDetail(payload: unknown): string | undefined {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }
  if (typeof payload === "string") return payload;
  return undefined;
}

async function fetchTargetUserFromList(
  request: NextRequest,
  userId: string
): Promise<
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; status: number; detail: string; upstream?: unknown }
> {
  const usersUrl = new URL("/api/proxy/admin/users", request.url);

  logAdminViewAs("admin_view_as_target_lookup_attempt", {
    target_user_id: userId,
    source: "admin_users_list",
  });

  let usersResponse: Response;
  try {
    usersResponse = await fetch(usersUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });
  } catch (err) {
    logAdminViewAs("admin_view_as_target_lookup_failed", {
      target_user_id: userId,
      source: "admin_users_list",
      reason: err instanceof Error ? err.message : "fetch_failed",
    });
    return {
      ok: false,
      status: 503,
      detail: "Failed to load admin users list",
    };
  }

  const usersPayload = await readJsonOrText(usersResponse);
  if (!usersResponse.ok) {
    const detail =
      getDetail(usersPayload) ??
      `Admin users list failed with status ${usersResponse.status}`;
    logAdminViewAs("admin_view_as_target_lookup_failed", {
      target_user_id: userId,
      source: "admin_users_list",
      upstream_status: usersResponse.status,
      reason: detail,
    });
    return {
      ok: false,
      status: usersResponse.status >= 500 ? 502 : usersResponse.status,
      detail,
      upstream: usersPayload,
    };
  }

  const users = (usersPayload as AdminUsersResponse | null)?.users ?? [];
  const targetUser = users.find((user) => user.id === userId);
  if (!targetUser) {
    logAdminViewAs("admin_view_as_target_lookup_failed", {
      target_user_id: userId,
      source: "admin_users_list",
      upstream_status: usersResponse.status,
      reason: "target_user_not_found",
    });
    return {
      ok: false,
      status: 404,
      detail: "Target user not found",
    };
  }

  if (typeof targetUser.email !== "string" || !targetUser.email.trim()) {
    logAdminViewAs("admin_view_as_target_lookup_failed", {
      target_user_id: userId,
      source: "admin_users_list",
      upstream_status: usersResponse.status,
      reason: "target_user_missing_email",
    });
    return {
      ok: false,
      status: 502,
      detail: "Target user payload missing email",
    };
  }

  logAdminViewAs("admin_view_as_target_lookup_succeeded", {
    target_user_id: userId,
    source: "admin_users_list",
  });

  return {
    ok: true,
    user: {
      id: userId,
      email: targetUser.email,
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    logAdminViewAs("admin_view_as_requested", { target_user_id: userId });

    // 1. Verify admin session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifyJwt(token) : null;

    if (!session || session.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // 2. Validate userId (UUID post-Supabase migration)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      logAdminViewAs("admin_view_as_target_lookup_failed", {
        target_user_id: userId,
        reason: "invalid_user_id",
      });
      return NextResponse.json({ detail: "Invalid userId" }, { status: 400 });
    }

    // 3. Fetch target user through web proxy using request-derived absolute URL.
    //    The list fallback keeps view-as working if an older single-user proxy
    //    rejects Supabase UUIDs before the API receives the request.
    const userUrl = new URL(
      `/api/proxy/admin/users/${userId}`,
      request.url
    );

    logAdminViewAs("admin_view_as_target_lookup_attempt", {
      target_user_id: userId,
      source: "admin_user_detail",
    });

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
      logAdminViewAs("admin_view_as_target_lookup_failed", {
        target_user_id: userId,
        source: "admin_user_detail",
        reason: err instanceof Error ? err.message : "fetch_failed",
      });
      const fallback = await fetchTargetUserFromList(request, userId);
      if (!fallback.ok) {
        return NextResponse.json(
          { detail: fallback.detail, upstream: fallback.upstream },
          { status: fallback.status }
        );
      }
      return createAdminViewSession(fallback.user, uuidRegex);
    }

    const userPayload = await readJsonOrText(userResponse);

    if (!userResponse.ok) {
      logAdminViewAs("admin_view_as_target_lookup_failed", {
        target_user_id: userId,
        source: "admin_user_detail",
        upstream_status: userResponse.status,
        reason: getDetail(userPayload) ?? "upstream_lookup_failed",
      });

      const fallback = await fetchTargetUserFromList(request, userId);
      if (!fallback.ok) {
        const status =
          userResponse.status === 404 ? 404 : fallback.status >= 500 ? 502 : fallback.status;
        return NextResponse.json(
          {
            detail: fallback.detail,
            upstream: fallback.upstream ?? userPayload,
          },
          { status }
        );
      }
      return createAdminViewSession(fallback.user, uuidRegex);
    }

    const targetUser = userPayload as {
      id?: string;
      email?: string;
    } | null;

    if (
      !targetUser ||
      typeof targetUser.email !== "string" ||
      !targetUser.email.trim()
    ) {
      logAdminViewAs("admin_view_as_target_lookup_failed", {
        target_user_id: userId,
        source: "admin_user_detail",
        upstream_status: userResponse.status,
        reason: "target_user_missing_email",
      });
      return NextResponse.json(
        { detail: "Target user payload missing email" },
        { status: 502 }
      );
    }

    const targetUserId =
      typeof targetUser.id === "string" && uuidRegex.test(targetUser.id)
        ? targetUser.id
        : userId;

    logAdminViewAs("admin_view_as_target_lookup_succeeded", {
      target_user_id: targetUserId,
      source: "admin_user_detail",
    });

    return createAdminViewSession(
      { id: targetUserId, email: targetUser.email },
      uuidRegex
    );
  } catch (err) {
    console.error("[admin view-as]", err);
    return NextResponse.json(
      { detail: "Unexpected error in admin view-as route" },
      { status: 500 }
    );
  }
}

function createAdminViewSession(
  targetUser: { id: string; email: string },
  uuidRegex: RegExp
) {
  const targetUserId = uuidRegex.test(targetUser.id) ? targetUser.id : "";
  if (!targetUserId) {
    logAdminViewAs("admin_view_as_target_lookup_failed", {
      target_user_id: targetUser.id,
      reason: "invalid_target_user_id",
    });
    return NextResponse.json({ detail: "Invalid target user id" }, { status: 400 });
  }

  // Preserve current admin-view contract.
  const adminViewToken = signJwt({
    sub: targetUser.email,
    role: "user",
    mode: "admin_view",
    view_as_user_id: targetUserId,
    read_only: true,
    exp: Math.floor(Date.now() / 1000) + 900,
  });

  // Set session cookie and return JSON success. Returning a redirect would send
  // 307 and preserve POST, causing POST /portal -> 405.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, adminViewToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });

  logAdminViewAs("admin_view_as_session_created", {
    target_user_id: targetUserId,
    read_only: true,
    ttl_seconds: 900,
  });

  return response;
}
