/**
 * Server-side proxy: POST /api/proxy/feedback
 *
 * Forwards feedback submissions to the API backend.
 * Sprint 15.0: Post-analysis feedback with optional user linkage.
 * Sprint 17.1: Check read-only mode and reject if in admin_view mode.
 */

import { checkReadOnlyMode } from "@/lib/api/read-only-check";
import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Sprint 17.1: Check read-only mode
  const { isReadOnly, error } = await checkReadOnlyMode();
  if (isReadOnly && error) {
    return NextResponse.json(
      { detail: error.detail },
      { status: error.status }
    );
  }

  const path = "/api/feedback/";
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
    return NextResponse.json(
      { detail: "Feedback service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  return NextResponse.json(data, { status: upstreamResponse.status });
}
