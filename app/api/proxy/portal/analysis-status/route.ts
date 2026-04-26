/**
 * GET /api/proxy/portal/analysis-status?job_id=...
 * Poll upload status for a specific analysis — Sprint 36.0
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { signRequest } from "@/lib/api/signing";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const session = verifyJwt(token);
  if (!session?.sub) return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const jobId = new URL(request.url).searchParams.get("job_id");
  if (!jobId) return NextResponse.json({ detail: "job_id required" }, { status: 400 });

  const path = `/api/users/me/analyses/${jobId}/status`;
  const sigHeaders = signRequest("GET", path);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders, "X-User-Email": session.sub },
    });
    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Service unavailable" }, { status: 503 });
  }
}
