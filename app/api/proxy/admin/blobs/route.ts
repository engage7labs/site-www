/**
 * Server-side proxy: GET /api/proxy/admin/blobs
 *                    DELETE /api/proxy/admin/blobs?container=...&blob_path=...
 *
 * Sprint 36.0: Blob storage visibility for admin dashboard.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifyJwt(token);
  if (!session?.sub || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const path = "/api/admin/blobs";
  const sigHeaders = signRequest("GET", path);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders, "X-User-Email": session.sub },
    });
    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Admin service unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const container = searchParams.get("container");
  const blob_path = searchParams.get("blob_path");

  if (!container || !blob_path) {
    return NextResponse.json({ detail: "container and blob_path required" }, { status: 400 });
  }

  const path = `/api/admin/blobs?container=${encodeURIComponent(container)}&blob_path=${encodeURIComponent(blob_path)}`;
  const sigHeaders = signRequest("DELETE", "/api/admin/blobs");

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...sigHeaders, "X-User-Email": session.sub },
    });
    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Admin service unavailable" }, { status: 503 });
  }
}
