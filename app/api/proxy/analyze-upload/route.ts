/**
 * Server-side proxy: POST /api/proxy/analyze-upload
 *
 * Forwards the multipart upload to the API backend with HMAC signing.
 * Browser never calls the API directly for this sensitive endpoint.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ detail: "This route is retired." }, { status: 410 });
}
