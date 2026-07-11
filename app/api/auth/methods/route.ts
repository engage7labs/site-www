import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = verifyJwt(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "");
  if (!session?.user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(session.user_id);
  if (error || !data.user) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  const providers = new Set<string>(
    Array.isArray(data.user.app_metadata?.providers)
      ? data.user.app_metadata.providers
      : [],
  );
  for (const identity of data.user.identities ?? []) providers.add(identity.provider);
  return NextResponse.json({
    password: providers.has("email"),
    google: providers.has("google"),
  });
}
