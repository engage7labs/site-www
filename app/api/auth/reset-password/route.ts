/**
 * POST /api/auth/reset-password
 *
 * Proxies reset-password requests to the backend API.
 *
 * Backward compatibility:
 * - Preferred upstream: /auth/reset-password
 * - Fallback (when upstream is 404): verify reset token here and call /auth/set-password
 */

import { signRequest } from "@/lib/api/signing";
import { verifyJwt } from "@/lib/auth-server";
import { ensureProtocol } from "@/lib/config";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
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

  if (upstream.status !== 404) {
    const data = await upstream
      .json()
      .catch(() => ({ error: "Upstream error" }));
    return NextResponse.json(data, { status: upstream.status });
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  }

  if (
    !body.password ||
    typeof body.password !== "string" ||
    body.password.length < 8
  ) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 422 }
    );
  }

  const payload = verifyJwt(body.token);
  if (!payload?.sub) {
    return NextResponse.json(
      { error: "Invalid or expired reset link" },
      { status: 401 }
    );
  }

  const purposeField = (payload as Record<string, unknown>).purpose;
  if (purposeField !== "password_reset") {
    return NextResponse.json({ error: "Invalid reset token" }, { status: 401 });
  }

  const fallbackPath = "/auth/set-password";
  const sigHeaders = signRequest("POST", fallbackPath);

  let fallbackUpstream: Response;
  try {
    fallbackUpstream = await fetch(`${apiBaseUrl}${fallbackPath}`, {
      method: "POST",
      headers: { ...sigHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.sub, password: body.password }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const fallbackData = await fallbackUpstream
    .json()
    .catch(() => ({ error: "Upstream error" }));
  return NextResponse.json(fallbackData, { status: fallbackUpstream.status });
}
