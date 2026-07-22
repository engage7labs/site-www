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
  if (!session?.sub || !session.user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = "/api/users/me/analytics-status";
  const sigHeaders = signRequest("GET", path);
  try {
    const upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        ...sigHeaders,
        "X-User-Id": session.user_id,
      },
      cache: "no-store",
    });
    const data = await upstreamResponse
      .json()
      .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));
    return NextResponse.json(data, {
      status: upstreamResponse.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Analytics status service unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
