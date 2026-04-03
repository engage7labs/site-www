/**
 * POST /api/auth/reset-password
 *
 * Verifies a password-reset JWT token and sets the new password
 * via the backend API. Sprint 17.4.
 */

import { signRequest } from "@/lib/api/signing";
import { verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  }

  if (!body.password || typeof body.password !== "string" || body.password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 422 }
    );
  }

  const payload = verifyJwt(body.token);
  if (!payload?.sub) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 401 });
  }

  // Verify this is actually a password_reset token
  const purposeField = (payload as Record<string, unknown>).purpose;
  if (purposeField !== "password_reset") {
    return NextResponse.json({ error: "Invalid reset token" }, { status: 401 });
  }

  const path = "/auth/set-password";
  const sigHeaders = signRequest("POST", path);

  let upstream: Response;
  try {
    upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: { ...sigHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.sub, password: body.password }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const data = await upstream.json().catch(() => ({ error: "Upstream error" }));
  return NextResponse.json(data, { status: upstream.status });
}
