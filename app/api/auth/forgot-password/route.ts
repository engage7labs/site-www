import { buildAuthCallbackUrl, resolveAuthRedirectOrigin } from "@/lib/auth-redirects";
import { createSupabaseAuthServerClient } from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCEPTED = {
  ok: true,
  status: "accepted",
  message: "If an account is eligible, we'll send recovery instructions.",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(ACCEPTED);
  }

  try {
    const redirectTo = buildAuthCallbackUrl(
      resolveAuthRedirectOrigin(request.nextUrl.origin),
      "/auth/reset-password",
    );
    const supabase = createSupabaseAuthServerClient();
    // Supabase deliberately keeps this flow non-enumerating.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  } catch {
    // Keep the unauthenticated response indistinguishable.
  }
  return NextResponse.json(ACCEPTED);
}
