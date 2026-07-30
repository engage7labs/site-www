import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session?.sub || !session.user_id || session.mode === "admin_view") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }
  const path = "/api/users/me/reanalyse";
  try {
    const response = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: { ...signRequest("POST", path), "X-User-Id": session.user_id, "X-User-Email": session.sub },
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Analysis service unavailable" }, { status: 503 });
  }
}
