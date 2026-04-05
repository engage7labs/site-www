/**
 * POST /api/auth/reset-password
 *
 * Proxies reset-password requests to the backend API.
 */

import { ensureProtocol } from "@/lib/config";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const apiBaseUrl = ensureProtocol(
    process.env.API_BASE_URL ?? INTERNAL_API_BASE_URL
  );
  const path = "/auth/reset-password";

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const data = await upstream.json().catch(() => ({ error: "Upstream error" }));
  return NextResponse.json(data, { status: upstream.status });
}
