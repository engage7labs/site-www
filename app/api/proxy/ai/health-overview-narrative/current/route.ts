/**
 * Server-side proxy: GET /api/proxy/ai/health-overview-narrative/current
 */

import { signRequest } from "@/lib/api/signing";
import { canonicalAiReflectionLocale } from "@/lib/ai-reflections";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const analysisId = request.nextUrl.searchParams.get("analysis_id")?.trim();
  const evidenceHash = request.nextUrl.searchParams
    .get("input_evidence_pack_hash")
    ?.trim();
  const rawLocale = request.nextUrl.searchParams.get("locale")?.trim();
  const locale = canonicalAiReflectionLocale(rawLocale);

  if (!analysisId || analysisId.length > 120 || !evidenceHash || evidenceHash.length > 120) {
    return NextResponse.json({ detail: "Invalid current artifact context" }, { status: 422 });
  }

  const path = "/api/ai/health-overview-narrative/current";
  const upstreamUrl = new URL(`${INTERNAL_API_BASE_URL}${path}`);
  upstreamUrl.searchParams.set("analysis_id", analysisId);
  upstreamUrl.searchParams.set("input_evidence_pack_hash", evidenceHash);
  upstreamUrl.searchParams.set("locale", locale);
  const sigHeaders = signRequest("GET", path);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
      },
      cache: "no-store",
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "AI reflection service unavailable" },
      { status: 503 },
    );
  }
}
