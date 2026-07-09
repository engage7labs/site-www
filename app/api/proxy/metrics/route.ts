/**
 * Server-side proxy: GET /api/proxy/metrics
 *
 * Public aggregate metrics used by Community Activity. Kept behind the
 * server-side API resolver so deployed DEV cannot depend on a stale or
 * missing browser-baked NEXT_PUBLIC_API_BASE_URL.
 */

import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const path = "/api/metrics";
  const sigHeaders = signRequest("GET", path);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Metrics service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  return NextResponse.json(data, { status: upstreamResponse.status });
}
