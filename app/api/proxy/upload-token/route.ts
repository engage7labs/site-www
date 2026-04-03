/**
 * POST /api/proxy/upload-token
 *
 * Returns pre-signed HMAC headers for a direct browser-to-API upload.
 *
 * WHY THIS EXISTS:
 * The web layer is hosted on Vercel, which has a hard 4.5 MB serverless
 * function body size limit. Real Apple Health exports are typically 5–150 MB,
 * so routing the upload through the Next.js proxy causes a 413.
 *
 * SOLUTION:
 * 1. Browser calls this endpoint (tiny request) → gets pre-signed headers.
 * 2. Browser POSTs the FormData directly to the API using those headers.
 * 3. The HMAC secret never leaves this server — only the computed signature
 *    is returned. Signatures expire within 5 minutes (API enforces this).
 */

import { checkReadOnlyMode } from "@/lib/api/read-only-check";
import { signRequest } from "@/lib/api/signing";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const { isReadOnly, error } = await checkReadOnlyMode();
  if (isReadOnly) {
    return NextResponse.json(
      { detail: error!.detail },
      { status: error!.status }
    );
  }

  const path = "/api/analyze-upload";
  const sigHeaders = signRequest("POST", path);

  // NEXT_PUBLIC_API_BASE_URL is the public API URL.
  // The browser will POST the FormData directly to this URL.
  const uploadUrl = `${
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  }${path}`;

  return NextResponse.json({
    uploadUrl,
    headers: sigHeaders,
  });
}
