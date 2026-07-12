export interface AuthenticatedAppUserSyncResult {
  role: "user" | "admin" | null;
  appUserId: string | null;
  lookupStatus: "found" | "not_found" | "error";
  roleSource:
    | "sync_authenticated_response.role"
    | "sync_authenticated_response.role_missing_default_user"
    | "sync_authenticated_upstream_error";
  failureStage: "sync_authenticated_upstream" | null;
}

export function resolveAuthenticatedAppUserSyncResponse(data: {
  id?: unknown;
  role?: unknown;
}): AuthenticatedAppUserSyncResult {
  const appUserId = typeof data.id === "string" ? data.id : null;
  const hasRole = typeof data.role === "string";

  return {
    role: data.role === "admin" ? "admin" : "user",
    appUserId,
    lookupStatus: appUserId ? "found" : "not_found",
    roleSource: hasRole
      ? "sync_authenticated_response.role"
      : "sync_authenticated_response.role_missing_default_user",
    failureStage: null,
  };
}
