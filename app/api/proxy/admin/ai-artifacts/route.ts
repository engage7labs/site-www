/**
 * Server-side proxy: GET /api/proxy/admin/ai-artifacts
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_PARAMS = new Set([
  "validation_status",
  "gate_mode",
  "feature_key",
  "provider",
  "model",
  "locale",
  "created_from",
  "created_to",
  "limit",
  "offset",
]);

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.role !== "admin") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const path = "/api/admin/ai-artifacts";
  const upstreamUrl = new URL(`${INTERNAL_API_BASE_URL}${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (ALLOWED_PARAMS.has(key) && value.trim()) {
      upstreamUrl.searchParams.set(key, value.trim());
    }
  });

  const sigHeaders = signRequest("GET", path);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
      },
      cache: "no-store",
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "Admin AI artifacts service unavailable" },
      { status: 503 }
    );
  }
}
