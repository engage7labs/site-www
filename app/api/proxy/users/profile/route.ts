/**
 * Server-side proxy: GET /api/proxy/users/profile
 *                    PATCH /api/proxy/users/profile
 *
 * Read and update user profile type for the authenticated user.
 * Profile types: general, amateur_athlete, student, entrepreneur.
 *
 * Profile type influences language/UX priority only.
 * It does NOT change physiological thresholds, DARTH formulas, or medical claims.
 *
 * Sprint 42.0: User Profile v1 foundation.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_PROFILE_TYPES = new Set([
  "general",
  "amateur_athlete",
  "student",
  "entrepreneur",
]);

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = "/api/users/me/profile";
  const sigHeaders = signRequest("GET", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
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
      { detail: "User profile service unavailable" },
      { status: 503 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.mode === "admin_view") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    user_profile_type?: unknown;
  } | null;

  const profileType =
    typeof body?.user_profile_type === "string"
      ? body.user_profile_type.trim().toLowerCase()
      : null;

  if (!profileType || !VALID_PROFILE_TYPES.has(profileType)) {
    return NextResponse.json(
      {
        detail:
          "Invalid profile type. Accepted: general, amateur_athlete, student, entrepreneur",
      },
      { status: 422 }
    );
  }

  const path = "/api/users/me/profile";
  const sigHeaders = signRequest("PATCH", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
        "X-User-Id": session.user_id, "X-User-Email": session.sub,
      },
      body: JSON.stringify({ user_profile_type: profileType }),
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "User profile service unavailable" },
      { status: 503 }
    );
  }
}
