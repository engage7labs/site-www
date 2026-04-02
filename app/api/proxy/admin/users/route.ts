/**
 * Server-side proxy: GET /api/proxy/admin/users
 *
 * Forwards admin requests to the API backend.
 * Sprint 15.0: Admin panel API proxy.
 */

import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminKey = request.nextUrl.searchParams.get("admin_key") ?? "";
  const path = "/api/admin/users";
  const sigHeaders = signRequest("GET", path);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        ...sigHeaders,
        "X-Admin-Key": adminKey,
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Admin service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  return NextResponse.json(data, { status: upstreamResponse.status });
}
