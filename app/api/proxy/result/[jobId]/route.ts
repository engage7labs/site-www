/**
 * Server-side proxy: GET /api/proxy/result/[jobId]
 *
 * Forwards result polling requests to the API backend with HMAC signing.
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
  const path = `/api/result/${jobId}`;
  const sigHeaders = signRequest("GET", path);

  const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "GET",
    headers: { ...sigHeaders },
  });

  const data = await upstreamResponse.json();

  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
  };

  return NextResponse.json(data, {
    status: upstreamResponse.status,
    headers,
  });
}
