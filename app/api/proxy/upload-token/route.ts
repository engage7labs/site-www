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
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session?.user_id) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (session.mode === "admin_view") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

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
  const rawLocale = body?.get("locale");
  const locale = typeof rawLocale === "string" ? rawLocale : "en-IE";

  const sasPath = "/api/users/me/upload-sas";
  const sigHeaders = signRequest("POST", sasPath);

  const formData = new FormData();
  formData.append("locale", locale);

  const sasRes = await fetch(`${apiBase}${sasPath}`, {
    method: "POST",
    headers: {
      ...sigHeaders,
      "X-User-Id": session.user_id,
      "X-User-Email": session.sub,
    },
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

  return NextResponse.json({
    mode: "direct-blob",
    job_id,
    sas_url,
    blob_path,
  });
}
