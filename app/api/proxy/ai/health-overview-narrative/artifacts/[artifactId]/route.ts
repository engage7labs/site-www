/**
 * Server-side proxy: GET /api/proxy/ai/health-overview-narrative/artifacts/[artifactId]
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { artifactId } = await params;
  if (!/^\d+$/.test(artifactId)) {
    return NextResponse.json({ detail: "Invalid artifact id" }, { status: 422 });
  }

  const path = `/api/ai/health-overview-narrative/artifacts/${artifactId}`;
  const sigHeaders = signRequest("GET", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
      },
      cache: "no-store",
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "AI reflection artifact service unavailable" },
      { status: 503 },
    );
  }
}
