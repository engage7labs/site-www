import { buildAuthCallbackUrl, resolveAuthRedirectOrigin } from "@/lib/auth-redirects";
import { createSupabaseAuthServerClient } from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmation =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
  if (!email || password.length < 8 || password !== confirmation) {
    return NextResponse.json({ error: "Unable to create account." }, { status: 422 });
  }

  try {
    const origin = resolveAuthRedirectOrigin(request.nextUrl.origin);
    const emailRedirectTo = buildAuthCallbackUrl(origin, "/portal");
    const supabase = createSupabaseAuthServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) {
      return NextResponse.json(
        { error: "Unable to create account. Please check the details and try again." },
        { status: 400 },
      );
    }

    // Same response for new and existing addresses prevents enumeration.
    return NextResponse.json(
      {
        ok: true,
        message: "If the account is eligible, check your email for next steps.",
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { error: "Registration service unavailable" },
      { status: 503 },
    );
  }
}
