/**
 * Server-side proxy: POST /api/proxy/analyze-upload
 *
 * Forwards the multipart upload to the API backend with HMAC signing.
 * Browser never calls the API directly for this sensitive endpoint.
 */

import { checkReadOnlyMode } from "@/lib/api/read-only-check";
import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { isReadOnly, error } = await checkReadOnlyMode();
  if (isReadOnly) {
    return NextResponse.json(
      { detail: error!.detail },
      { status: error!.status }
    );
  }

  const path = "/api/analyze-upload";
  const sigHeaders = signRequest("POST", path);

  // Stream the raw body through — preserve multipart Content-Type with boundary.
  const contentType = request.headers.get("content-type") ?? "";

  const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      ...sigHeaders,
    },
    body: request.body,
    // @ts-expect-error — Next.js supports duplex streaming
    duplex: "half",
  });

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
