/**
 * Server-side proxy: GET /api/proxy/ai/health-overview-narrative/history
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPPORTED_LOCALES = new Set(["en-IE", "pt-BR", "hi-IN"]);

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

  const path = "/api/ai/health-overview-narrative/history";
  const upstreamUrl = new URL(`${INTERNAL_API_BASE_URL}${path}`);
  const analysisId = request.nextUrl.searchParams.get("analysis_id")?.trim();
  const locale = request.nextUrl.searchParams.get("locale")?.trim();
  const limit = request.nextUrl.searchParams.get("limit")?.trim();
  const offset = request.nextUrl.searchParams.get("offset")?.trim();

  if (analysisId && analysisId.length <= 120) {
    upstreamUrl.searchParams.set("analysis_id", analysisId);
  }
  if (locale && SUPPORTED_LOCALES.has(locale)) {
    upstreamUrl.searchParams.set("locale", locale);
  }
  if (limit && /^\d+$/.test(limit)) {
    upstreamUrl.searchParams.set("limit", limit);
  }
  if (offset && /^\d+$/.test(offset)) {
    upstreamUrl.searchParams.set("offset", offset);
  }

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
      { detail: "AI reflection history service unavailable" },
      { status: 503 },
    );
  }
}
