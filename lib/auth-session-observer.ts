import { signRequest } from "@/lib/api/signing";
import type { SessionPayload } from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";

export async function markAuthenticatedSessionObserved(
  session: SessionPayload
): Promise<void> {
  if (!session.sub) return;
  const isReadOnly = Boolean(session.read_only);
  if (session.mode === "admin_view" || isReadOnly) return;

  const path = "/api/users/me/session-observed";
  const sigHeaders = signRequest("POST", path);

  try {
    await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        ...sigHeaders,
        "X-User-Email": session.sub,
        "X-Session-Mode": session.mode ?? "",
        "X-Read-Only": isReadOnly ? "true" : "false",
      },
    });
  } catch {
    // Login metadata is best-effort and must not break session checks.
  }
}
