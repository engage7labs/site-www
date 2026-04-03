/**
 * POST /api/auth/set-password
 *
 * Sets the password for the currently authenticated user.
 * Sprint 17.4: First-time password creation for passwordless users.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.password || typeof body.password !== "string" || body.password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 422 }
    );
  }

  const path = "/auth/set-password";
  const sigHeaders = signRequest("POST", path);

  let upstream: Response;
  try {
    upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: { ...sigHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.sub, password: body.password }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const data = await upstream.json().catch(() => ({ error: "Upstream error" }));
  return NextResponse.json(data, { status: upstream.status });
}
