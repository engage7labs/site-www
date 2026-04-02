/**
 * Server-side proxy: GET /api/proxy/result/[jobId]/pdf
 *
 * Streams the PDF report from the API backend with HMAC signing.
 * Sprint 15.0: Premium-only — requires active trial or premium plan.
 */

import { signRequest } from "@/lib/api/signing";
import { isValidSession, SESSION_COOKIE_NAME } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  /* ---- Premium gate --------------------------------------------------- */
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await isValidSession(cookie);
  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required for PDF export" },
      { status: 401 }
    );
  }

  // Verify the user has an active plan (trial or premium)
  const userPath = `/api/users/me?email=${encodeURIComponent(session.sub)}`;
  const userSigHeaders = signRequest("GET", userPath);
  try {
    const userRes = await fetch(`${INTERNAL_API_BASE_URL}${userPath}`, {
      headers: { ...userSigHeaders },
    });
    if (userRes.ok) {
      const user = await userRes.json();
      if (user.plan === "expired") {
        return NextResponse.json(
          { detail: "Premium plan required for PDF export" },
          { status: 403 }
        );
      }
    }
  } catch {
    // If user service is unavailable, allow the download rather than block
  }

  /* ---- Proxy to backend ---------------------------------------------- */
  const { jobId } = await params;
  const path = `/api/result/${jobId}/pdf`;
  const sigHeaders = signRequest("GET", path);

  const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "GET",
    headers: { ...sigHeaders },
  });

  if (!upstreamResponse.ok) {
    const data = await upstreamResponse.json().catch(() => ({
      detail: `Upstream error ${upstreamResponse.status}`,
    }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="engage7_report_${jobId}.pdf"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
