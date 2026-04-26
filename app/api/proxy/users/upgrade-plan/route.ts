/**
 * POST /api/proxy/users/upgrade-plan — Sprint 33.0
 *
 * Internal proxy used by the Stripe webhook to upgrade a user's plan.
 * This endpoint itself is NOT authenticated by JWT — it's called server-to-server
 * by the webhook handler and the upstream call is HMAC-signed.
 *
 * Note: This route is only called by /api/stripe/webhook (same Next.js server).
 */

import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const path = "/api/users/upgrade-plan";
  const sigHeaders = signRequest("POST", path);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...sigHeaders },
      body,
    });
  } catch {
    return NextResponse.json({ detail: "Service unavailable" }, { status: 503 });
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  return NextResponse.json(data, { status: upstreamResponse.status });
}
