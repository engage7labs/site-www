/**
 * POST /api/proxy/portal/upload
 * Auth-gated upload proxy — Sprint 36.0
 *
 * Forwards multipart ZIP to API /api/users/me/upload with user email
 * extracted from verified JWT session cookie.
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { signRequest } from "@/lib/api/signing";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub || session.mode === "admin_view") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const path = "/api/users/me/upload";
  const sigHeaders = signRequest("POST", path);

  // Forward the raw multipart body directly to the API
  const formData = await request.formData();
  const upstreamForm = new FormData();

  const file = formData.get("file") as File | null;
  const locale = (formData.get("locale") as string) ?? "en-IE";

  if (!file) {
    return NextResponse.json({ detail: "No file provided" }, { status: 400 });
  }

  upstreamForm.append("file", file, file.name);
  upstreamForm.append("locale", locale);

  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
      },
      body: upstreamForm,
    });

    const data = await res.json().catch(() => ({ detail: `Upstream error ${res.status}` }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Upload service unavailable" }, { status: 503 });
  }
}
