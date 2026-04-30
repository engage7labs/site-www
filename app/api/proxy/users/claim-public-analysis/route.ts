/**
 * Server-side proxy: POST /api/proxy/users/claim-public-analysis
 *
 * Imports a completed public AnalysisJob into the authenticated Portal.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.mode === "admin_view") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.job_id !== "string") {
    return NextResponse.json({ detail: "job_id is required" }, { status: 400 });
  }

  const path = "/api/users/me/claim-public-analysis";
  const sigHeaders = signRequest("POST", path);

  try {
    const upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
        "X-User-Email": session.sub,
      },
      body: JSON.stringify({ job_id: body.job_id }),
    });

    const data = await upstream
      .json()
      .catch(() => ({ detail: `Upstream error ${upstream.status}` }));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: "Claim service unavailable" },
      { status: 503 },
    );
  }
}
