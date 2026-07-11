/**
 * Server-side proxy: GET/PATCH /api/proxy/users/health-footprint
 *
 * Reads and updates the authenticated user's privacy-safe Update Data
 * protection setting.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function readSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

export async function GET() {
  const session = await readSession();
  if (!session?.sub) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const path = "/api/users/me/health-footprint";
  const sigHeaders = signRequest("GET", path);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { ...sigHeaders, "X-User-Id": session.user_id, "X-User-Email": session.sub },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Footprint settings service unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await readSession();
  if (!session?.sub) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  if (session.mode === "admin_view" || session.read_only === true) {
    return NextResponse.json(
      { detail: "Cannot modify Health Footprint protection while viewing as user (read-only mode)" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const path = "/api/users/me/health-footprint";
  const sigHeaders = signRequest("PATCH", path);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
        "X-Session-Mode": session.mode ?? "",
        "X-Read-Only": "false",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Footprint settings service unavailable" }, { status: 503 });
  }
}
