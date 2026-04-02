/**
 * Server-side proxy: DELETE /api/proxy/users/me
 *
 * GDPR right-to-erasure endpoint.
 * Verifies the session JWT, then hard-deletes the authenticated user and
 * all linked data (user_analyses, feedback) from the backend.
 * Clears the session cookie on success so the browser is immediately
 * signed out.
 *
 * Sprint 15.3: Trust Layer — delete account from portal settings.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.sub;
  const path = `/api/users/me?email=${encodeURIComponent(email)}`;
  const sigHeaders = signRequest("DELETE", path);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...sigHeaders },
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

  // Clear session cookie on successful deletion so the browser is signed out
  if (upstreamResponse.ok) {
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
