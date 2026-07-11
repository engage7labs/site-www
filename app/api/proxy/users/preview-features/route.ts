/**
 * Server-side proxy: GET /api/proxy/users/preview-features
 *
 * Returns enabled preview features for the authenticated user.
 * Safe fields only: feature_key, label, enabled, surface, rollout_scope,
 * admin_only, plan_scope. No secrets or internal config exposed.
 *
 * Sprint 42.0: FeaturePreview foundation.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

  const path = "/api/users/me/preview-features";
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
    // Graceful degradation: Portal must not crash if preview features fail to load
    return NextResponse.json({ features: [] }, { status: 200 });
  }
}
