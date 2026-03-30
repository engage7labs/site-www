/**
 * Server-side proxy: POST /api/proxy/events
 *
 * Forwards user event payloads to the API backend.
 */

import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const path = "/api/events";
  const sigHeaders = signRequest("POST", path);
  const rawBody = await request.text();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body: rawBody,
    });
  } catch {
    // API backend unreachable — analytics is best-effort, return 503
    return NextResponse.json(
      { detail: "Event service unavailable" },
      { status: 503 }
    );
  }

  if (upstreamResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  return NextResponse.json(data, { status: upstreamResponse.status });
}
