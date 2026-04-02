/**
 * Server-side proxy: POST /api/proxy/users/create-or-get
 *
 * Forwards user creation requests to the API backend.
 * Sprint 15.0: Passwordless user creation with trial plan.
 * Sprint 15.2: Sets session cookie so user lands authenticated in portal.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, SESSION_HOURS, signJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const path = "/api/users/create-or-get";
  const sigHeaders = signRequest("POST", path);
  const rawBody = await request.text();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body: rawBody,
    });
  } catch {
    return NextResponse.json(
      { detail: "User service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  const res = NextResponse.json(data, { status: upstreamResponse.status });

  // Sprint 15.2: Set session cookie on successful user creation/retrieval
  // so the user lands authenticated when navigating to /portal.
  if (upstreamResponse.ok && data.email) {
    const token = signJwt({ sub: data.email, role: "user" });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 3600,
    });
  }

  return res;
}
