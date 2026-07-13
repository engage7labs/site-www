import { buildAuthCallbackUrl, resolveAuthRedirectOrigin } from "@/lib/auth-redirects";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { authenticatedSupabaseClient } from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const appSession = verifyJwt(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "");
  if (!appSession?.user_id || appSession.mode === "admin_view") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const authenticated = await authenticatedSupabaseClient(request);
  if (!authenticated || authenticated.session.user.id !== appSession.user_id) {
    return NextResponse.json(
      { error: "Please sign in again before connecting Apple." },
      { status: 401 },
    );
  }
  const redirectTo = buildAuthCallbackUrl(
    resolveAuthRedirectOrigin(request.nextUrl.origin),
    "/portal/settings",
  );
  const { data, error } = await authenticated.client.auth.linkIdentity({
    provider: "apple",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    return NextResponse.json(
      { error: "Apple could not be connected. Please try again." },
      { status: 409 },
    );
  }
  return NextResponse.json({ url: data.url });
}
