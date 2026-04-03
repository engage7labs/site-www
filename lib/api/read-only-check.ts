/**
 * API read-only enforcement helper
 *
 * Sprint 17.1: Portal Observability
 * Blocks mutations in admin_view mode
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { cookies } from "next/headers";

export async function checkReadOnlyMode(): Promise<{
  isReadOnly: boolean;
  error?: { detail: string; status: number };
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;

  if (session?.read_only === true) {
    return {
      isReadOnly: true,
      error: {
        detail: "Cannot modify data while viewing as user (read-only mode)",
        status: 403,
      },
    };
  }

  return { isReadOnly: false };
}
