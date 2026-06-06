/**
 * Server-side proxy: PATCH /api/proxy/admin/features/[featureKey]
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_ROLLOUT_TARGETS = new Set([
  "admin",
  "premium_free",
  "premium",
  "super_premium",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ featureKey: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.role !== "admin") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { featureKey } = await params;
  const safeFeatureKey = featureKey.trim();
  if (!/^[a-z0-9_:-]{3,120}$/.test(safeFeatureKey)) {
    return NextResponse.json({ detail: "Invalid feature key" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    enabled?: unknown;
    rollout_targets?: unknown;
  } | null;

  const rolloutTargets = Array.isArray(body?.rollout_targets)
    ? body.rollout_targets
        .filter((target): target is string => typeof target === "string")
        .map((target) => target.trim().toLowerCase())
        .filter((target) => VALID_ROLLOUT_TARGETS.has(target))
    : undefined;

  const upstreamBody: { enabled?: boolean; rollout_targets?: string[] } = {};
  if (typeof body?.enabled === "boolean") upstreamBody.enabled = body.enabled;
  if (rolloutTargets) upstreamBody.rollout_targets = Array.from(new Set(rolloutTargets));

  const path = `/api/admin/features/${safeFeatureKey}`;
  const sigHeaders = signRequest("PATCH", path);

  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "Admin feature service unavailable" },
      { status: 503 }
    );
  }
}
