/**
 * Server-side proxy: PATCH /api/proxy/users/preferences
 *
 * Persists authenticated account preferences. The language switcher remains
 * session-only; Settings calls this endpoint for future-login defaults.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
    preferred_locale?: unknown;
  } | null;
  const preferredLocale =
    typeof body?.preferred_locale === "string"
      ? normalizeLocale(body.preferred_locale)
      : null;
  if (!preferredLocale) {
    return NextResponse.json(
      { detail: "preferred_locale is required" },
      { status: 422 }
    );
  }

  const path = "/api/users/me/preferences";
  const sigHeaders = signRequest("PATCH", path);
  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
        "X-User-Email": session.sub,
      },
      body: JSON.stringify({ preferred_locale: preferredLocale }),
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "User service unavailable" },
      { status: 503 }
    );
  }
}
