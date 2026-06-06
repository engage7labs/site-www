/**
 * Server-side proxy: POST /api/proxy/ai/health-overview-narrative
 *
 * Session-authenticated proxy for the server-side AI DARTH Health Overview
 * endpoint. Feature/plan eligibility is enforced by the API Feature Access
 * policy so future rollout targets do not require proxy changes.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPPORTED_LOCALES = new Set(["en-IE", "pt-BR", "hi-IN"]);

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    analysis_id?: unknown;
    locale?: unknown;
  } | null;

  const locale =
    typeof body?.locale === "string" && SUPPORTED_LOCALES.has(body.locale)
      ? body.locale
      : "en-IE";
  const analysisId =
    typeof body?.analysis_id === "string" && body.analysis_id.trim().length <= 80
      ? body.analysis_id.trim()
      : undefined;

  const path = "/api/ai/health-overview-narrative";
  const sigHeaders = signRequest("POST", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale,
        ...(analysisId ? { analysis_id: analysisId } : {}),
      }),
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "AI service unavailable" },
      { status: 503 }
    );
  }
}
