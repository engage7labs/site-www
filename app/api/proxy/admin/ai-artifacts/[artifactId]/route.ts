/**
 * Server-side proxy: GET/DELETE /api/proxy/admin/ai-artifacts/[artifactId]
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<unknown> }
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

  const resolvedParams = await params;
  const artifactId =
    resolvedParams &&
    typeof resolvedParams === "object" &&
    typeof (resolvedParams as { artifactId?: unknown }).artifactId === "string"
      ? (resolvedParams as { artifactId: string }).artifactId
      : "";
  const safeArtifactId = artifactId.trim();
  if (!/^\d+$/.test(safeArtifactId)) {
    return NextResponse.json({ detail: "Invalid artifact id" }, { status: 400 });
  }

  const path = `/api/admin/ai-artifacts/${safeArtifactId}`;
  const sigHeaders = signRequest("GET", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
      },
      cache: "no-store",
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "Admin AI artifact service unavailable" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<unknown> }
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

  const resolvedParams = await params;
  const artifactId =
    resolvedParams &&
    typeof resolvedParams === "object" &&
    typeof (resolvedParams as { artifactId?: unknown }).artifactId === "string"
      ? (resolvedParams as { artifactId: string }).artifactId
      : "";
  const safeArtifactId = artifactId.trim();
  if (!/^\d+$/.test(safeArtifactId)) {
    return NextResponse.json({ detail: "Invalid artifact id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    confirmation?: unknown;
    final_confirm?: unknown;
  } | null;

  const path = `/api/admin/ai-artifacts/orphans/${safeArtifactId}`;
  const sigHeaders = signRequest("DELETE", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        confirmation: typeof body?.confirmation === "string" ? body.confirmation : "",
        final_confirm: body?.final_confirm === true,
      }),
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "Admin AI artifact delete service unavailable" },
      { status: 503 }
    );
  }
}
