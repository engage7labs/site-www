/**
 * GET /api/proxy/portal/analyses
 * List all analyses for the authenticated user — Sprint 36.0
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { signRequest } from "@/lib/api/signing";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const session = verifyJwt(token);
  if (!session?.sub) return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const path = "/api/users/me/analyses";
  const sigHeaders = signRequest("GET", path);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders, "X-User-Email": session.sub },
    });
    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Service unavailable" }, { status: 503 });
  }
}
