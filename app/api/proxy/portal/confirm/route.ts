/**
 * POST /api/proxy/portal/confirm
 *
 * Portal direct-to-blob confirm step — Sprint 36.0.4.
 *
 * Called by the browser AFTER the file has been PUT directly to Azure Blob
 * Storage via SAS URL (bypassing Vercel's 4.5 MB body limit).
 *
 * Verifies the JWT session, then calls the API to create the UserAnalysis
 * record and trigger the ingest ACA Job.
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { signRequest } from "@/lib/api/signing";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.mode === "admin_view") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const body = await request.formData().catch(() => null);
  const jobId = body?.get("job_id");
  const locale = (body?.get("locale") as string) ?? "en-IE";

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ detail: "job_id is required" }, { status: 400 });
  }

  const path = "/api/users/me/confirm-upload";
  const sigHeaders = signRequest("POST", path);

  const upstreamForm = new FormData();
  upstreamForm.append("job_id", jobId);
  upstreamForm.append("locale", locale);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
      },
      body: upstreamForm,
    });

    const data = await res
      .json()
      .catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Upload confirm service unavailable" },
      { status: 503 }
    );
  }
}
