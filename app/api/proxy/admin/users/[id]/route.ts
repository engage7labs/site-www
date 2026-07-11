/**
 * Server-side proxy: GET /api/proxy/admin/users/[id]
 *
 * Sprint 15.4: Role-protected admin user detail endpoint.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { deleteSupabaseAuthUserForAccount } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.role !== "admin") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = id.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return NextResponse.json({ detail: "Invalid user id" }, { status: 400 });
  }

  const path = `/api/admin/users/${userId}`;
  const sigHeaders = signRequest("GET", `/api/admin/users/${userId}`);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders, "X-User-Id": session.user_id, "X-User-Email": session.sub },
    });
  } catch {
    return NextResponse.json(
      { detail: "Admin service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  return NextResponse.json(data, { status: upstreamResponse.status });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function readAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session?.sub || session.role !== "admin") return null;
  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readAdminSession();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = id.trim();
  if (!isUuid(userId)) {
    return NextResponse.json({ detail: "Invalid user id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const path = `/api/admin/users/${userId}/health-footprint/disable`;
  const sigHeaders = signRequest("PATCH", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "Admin service unavailable" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readAdminSession();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = id.trim();
  if (!isUuid(userId)) {
    return NextResponse.json({ detail: "Invalid user id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const path = `/api/admin/users/${userId}`;
  const sigHeaders = signRequest("DELETE", path);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return NextResponse.json(
      { detail: "Admin service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  if (!upstreamResponse.ok) {
    return NextResponse.json(data, { status: upstreamResponse.status });
  }

  const deletedUserId =
    data && typeof data === "object" && "user_id" in data && typeof data.user_id === "string"
      ? data.user_id
      : userId;
  const deletedEmail =
    data && typeof data === "object" && "email" in data && typeof data.email === "string"
      ? data.email
      : typeof (body as { confirmation_email?: unknown }).confirmation_email === "string"
        ? (body as { confirmation_email: string }).confirmation_email
        : "";

  const authDelete = await deleteSupabaseAuthUserForAccount(deletedUserId, deletedEmail);
  if (!authDelete.ok) {
    return NextResponse.json(
      {
        detail:
          "User app data was deleted, but Supabase Auth cleanup failed. Please retry or check Auth manually.",
        reason: authDelete.reason ?? "unknown",
      },
      { status: 502 }
    );
  }

  const responseData = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return NextResponse.json(
    {
      ...responseData,
      supabase_auth_deleted: true,
      supabase_auth_already_absent: authDelete.alreadyAbsent === true,
    },
    { status: upstreamResponse.status }
  );
}
