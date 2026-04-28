/**
 * Server-side proxy: DELETE /api/proxy/users/me
 *
 * GDPR right-to-erasure endpoint.
 * Verifies the session JWT, then hard-deletes the authenticated user and
 * all linked data (user_analyses, feedback) from the backend.
 * Clears the session cookie on success so the browser is immediately
 * signed out.
 *
 * Sprint 15.3: Trust Layer — delete account from portal settings.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { deleteSupabaseAuthUser } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function logAccountDelete(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {}
) {
  console.log(JSON.stringify({ event, ...fields }));
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.sub;
  logAccountDelete("account_delete_requested", {
    mode: session.mode ?? "user",
    target_user_id: session.view_as_user_id ?? null,
    role: session.role,
  });

  const path = `/api/users/me?email=${encodeURIComponent(email)}`;
  const getSigHeaders = signRequest("GET", path);

  let userLookupResponse: Response;
  try {
    userLookupResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...getSigHeaders },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "User service unavailable" },
      { status: 503 }
    );
  }

  const userLookupData = await userLookupResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${userLookupResponse.status}` }));

  if (!userLookupResponse.ok) {
    return NextResponse.json(userLookupData, { status: userLookupResponse.status });
  }

  const targetUserId =
    userLookupData &&
    typeof userLookupData === "object" &&
    "id" in userLookupData &&
    typeof userLookupData.id === "string"
      ? userLookupData.id
      : "";

  if (!targetUserId) {
    return NextResponse.json(
      { detail: "User service did not return a target user id" },
      { status: 502 }
    );
  }

  if (
    session.mode === "admin_view" &&
    session.view_as_user_id &&
    session.view_as_user_id !== targetUserId
  ) {
    return NextResponse.json(
      { detail: "Admin view-as target mismatch. Account was not deleted." },
      { status: 409 }
    );
  }

  logAccountDelete("account_delete_target_resolved", {
    target_user_id: targetUserId,
    mode: session.mode ?? "user",
  });

  logAccountDelete("account_delete_supabase_auth_attempt", {
    target_user_id: targetUserId,
  });

  const authDelete = await deleteSupabaseAuthUser(targetUserId);
  if (!authDelete.ok) {
    logAccountDelete("account_delete_supabase_auth_failed", {
      target_user_id: targetUserId,
      reason: authDelete.reason ?? "unknown",
    });
    return NextResponse.json(
      {
        detail:
          "Account deletion could not complete because authentication cleanup failed. Please try again.",
      },
      { status: 502 }
    );
  }

  logAccountDelete("account_delete_supabase_auth_succeeded", {
    target_user_id: targetUserId,
    already_absent: authDelete.alreadyAbsent === true,
  });

  const sigHeaders = signRequest("DELETE", path);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...sigHeaders },
    });
  } catch {
    return NextResponse.json(
      { detail: "User service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  const appCleanupOk = upstreamResponse.ok || upstreamResponse.status === 404;
  if (appCleanupOk) {
    logAccountDelete("account_delete_app_records_deleted", {
      target_user_id: targetUserId,
      source: upstreamResponse.ok ? "api_delete" : "supabase_auth_cascade",
      upstream_status: upstreamResponse.status,
    });
  }

  const responseStatus = upstreamResponse.status === 404 ? 200 : upstreamResponse.status;
  const responseBody =
    upstreamResponse.status === 404
      ? {
          ok: true,
          message: "Account and all associated data have been deleted.",
          user_id: targetUserId,
          deleted: { source: "supabase_auth_cascade" },
        }
      : data;

  const res = NextResponse.json(responseBody, { status: responseStatus });

  // Clear session cookie on successful deletion so the browser is signed out
  if (appCleanupOk) {
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
