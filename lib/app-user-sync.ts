import { signRequest } from "@/lib/api/signing";
import {
  resolveAuthenticatedAppUserSyncResponse,
  type AuthenticatedAppUserSyncResult,
} from "@/lib/app-user-sync-result";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";

export async function syncAuthenticatedAppUserWithDiagnostics(params: {
  accessToken: string;
  preferredLocale?: string;
}): Promise<AuthenticatedAppUserSyncResult> {
  const path = "/api/users/sync-authenticated";
  const upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
      ...signRequest("POST", path),
    },
    body: JSON.stringify({
      preferred_locale: params.preferredLocale,
    }),
    cache: "no-store",
  });
  if (!upstream.ok) {
    return {
      role: null,
      appUserId: null,
      lookupStatus: "error",
      roleSource: "sync_authenticated_upstream_error",
      failureStage: "sync_authenticated_upstream",
    };
  }

  const data = (await upstream.json().catch(() => ({}))) as {
    id?: unknown;
    role?: unknown;
  };
  return resolveAuthenticatedAppUserSyncResponse(data);
}

export async function syncAuthenticatedAppUser(params: {
  accessToken: string;
  preferredLocale?: string;
}): Promise<"user" | "admin" | null> {
  const result = await syncAuthenticatedAppUserWithDiagnostics(params);
  return result.role;
}
