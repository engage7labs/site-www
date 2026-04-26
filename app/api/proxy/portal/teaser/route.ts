/**
 * GET /api/proxy/portal/teaser?job_id=...
 *
 * Serves teaser HTML for a specific analysis (Sprint 36.0).
 * Security: verifies user owns the analysis before generating SAS URL.
 * Returns a short-lived redirect to the blob SAS URL (5 min TTL).
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

  const path = `/api/users/me/analyses/${jobId}/teaser-url`;
  const sigHeaders = signRequest("GET", path);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders, "X-User-Email": session.sub },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
      return NextResponse.json(data, { status: res.status });
    }

    const { url } = await res.json() as { url: string };
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ detail: "Service unavailable" }, { status: 503 });
  }
}
