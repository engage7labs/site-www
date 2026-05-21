/**
 * Server-side proxy: GET /api/proxy/admin/analysis-jobs/[jobId]/handoff-diagnostics
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<unknown> }
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

  const params = (await context.params) as { jobId?: string };
  const safeJobId = (params.jobId ?? "").trim();
  if (!safeJobId) {
    return NextResponse.json({ detail: "Invalid job id" }, { status: 400 });
  }

  const path = `/api/admin/analysis-jobs/${encodeURIComponent(safeJobId)}/handoff-diagnostics`;
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
