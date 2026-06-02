/**
 * Server-side proxy: DELETE /api/proxy/admin/users/[id]/health-footprint
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<unknown> }
) {
  const session = await readAdminSession();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const resolvedParams = await params;
  const rawId =
    resolvedParams &&
    typeof resolvedParams === "object" &&
    "id" in resolvedParams &&
    typeof (resolvedParams as { id?: unknown }).id === "string"
      ? (resolvedParams as { id: string }).id
      : "";
  const userId = rawId.trim();
  if (!isUuid(userId)) {
    return NextResponse.json({ detail: "Invalid user id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const path = `/api/admin/users/${userId}/health-footprint`;
  const sigHeaders = signRequest("DELETE", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
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
