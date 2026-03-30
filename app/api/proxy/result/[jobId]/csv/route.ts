/**
 * Server-side proxy: GET /api/proxy/result/[jobId]/csv
 *
 * Streams the CSV dataset from the API backend with HMAC signing.
 */

import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const path = `/api/result/${jobId}/csv`;
  const sigHeaders = signRequest("GET", path);

  const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "GET",
    headers: { ...sigHeaders },
  });

  if (!upstreamResponse.ok) {
    const data = await upstreamResponse.json().catch(() => ({
      detail: `Upstream error ${upstreamResponse.status}`,
    }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="features_daily_unified.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
