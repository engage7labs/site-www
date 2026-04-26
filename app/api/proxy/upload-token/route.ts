/**
 * POST /api/proxy/upload-token
 *
 * Returns a pre-signed SAS URL for direct browser-to-blob upload,
 * plus an API confirm URL to finalize the job after the blob upload.
 *
 * WHY THIS EXISTS:
 * Azure Container Apps has an Envoy proxy that stalls on large uploads.
 * By uploading directly to Azure Blob Storage via SAS URL, we bypass
 * both the Vercel 4.5 MB limit and the ACA proxy entirely.
 *
 * FLOW:
 * 1. Browser calls this endpoint → gets SAS URL + job_id + confirm URL.
 * 2. Browser PUTs the file directly to Azure Blob Storage via SAS URL.
 * 3. Browser POSTs to confirm URL to create the job and trigger analysis.
 */

import { checkReadOnlyMode } from "@/lib/api/read-only-check";
import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { isReadOnly, error } = await checkReadOnlyMode();
  if (isReadOnly) {
    return NextResponse.json(
      { detail: error!.detail },
      { status: error!.status }
    );
  }

  const apiBase = INTERNAL_API_BASE_URL;

  // Forward consent/locale/turnstile to the API's upload-sas endpoint
  // to get a SAS URL for direct blob upload.
  const body = await req.formData().catch(() => null);
  const rawConsent = body?.get("consent");
  const rawLocale = body?.get("locale");
  const rawTurnstile = body?.get("cf_turnstile_response");
  const consent = typeof rawConsent === "string" ? rawConsent : "true";
  const locale = typeof rawLocale === "string" ? rawLocale : "en-IE";
  const turnstile = typeof rawTurnstile === "string" ? rawTurnstile : "";

  const sasPath = "/api/upload-sas";
  const sigHeaders = signRequest("POST", sasPath);

  const formData = new FormData();
  formData.append("consent", consent);
  formData.append("locale", locale);
  if (turnstile) formData.append("cf_turnstile_response", turnstile);

  const sasRes = await fetch(`${apiBase}${sasPath}`, {
    method: "POST",
    headers: sigHeaders,
    body: formData,
  });

  if (!sasRes.ok) {
    const err = await sasRes
      .json()
      .catch(() => ({ detail: "Failed to get upload URL" }));
    return NextResponse.json(err, { status: sasRes.status });
  }

  const { job_id, sas_url, blob_path } = (await sasRes.json()) as {
    job_id: string;
    sas_url: string;
    blob_path: string;
  };

  // Build the confirm URL with signing headers
  const confirmPath = "/api/confirm-upload";
  const confirmSigHeaders = signRequest("POST", confirmPath);
  const confirmUrl = `${apiBase}${confirmPath}`;

  return NextResponse.json({
    mode: "direct-blob",
    job_id,
    sas_url,
    blob_path,
    confirmUrl,
    confirmHeaders: confirmSigHeaders,
    // Legacy fallback fields for backwards compat
    uploadUrl: `${apiBase}/api/analyze-upload`,
    headers: signRequest("POST", "/api/analyze-upload"),
  });
}
