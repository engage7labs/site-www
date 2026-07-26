import { PortalShell } from "@/components/portal/portal-shell";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import {
  createSupabaseAuthServerClient,
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
} from "@/lib/supabase-auth-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const appSession = verifyJwt(cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "");
  if (appSession?.mode !== "admin_view") {
    const accessToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;
    const refreshToken = cookieStore.get(SUPABASE_REFRESH_COOKIE)?.value;
    if (!accessToken || !refreshToken) redirect("/onboarding");

    const client = createSupabaseAuthServerClient();
    const sessionResult = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionResult.error || !sessionResult.data.session) redirect("/onboarding");
    const userResult = await client.auth.getUser();
    if (
      userResult.error ||
      userResult.data.user?.user_metadata?.engage7_onboarding_completed !== true
    ) {
      redirect("/onboarding");
    }
  }

  return <PortalShell>{children}</PortalShell>;
}
