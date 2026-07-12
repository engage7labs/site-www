import assert from "node:assert/strict";

const { resolveAuthenticatedAppUserSyncResponse } = await import(
  "../lib/app-user-sync-result.ts"
);

const admin = resolveAuthenticatedAppUserSyncResponse({
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "admin",
});
assert.equal(admin.role, "admin");
assert.equal(admin.lookupStatus, "found");
assert.equal(admin.roleSource, "sync_authenticated_response.role");

const missingRole = resolveAuthenticatedAppUserSyncResponse({
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});
assert.equal(missingRole.role, "user");
assert.equal(missingRole.lookupStatus, "found");
assert.equal(
  missingRole.roleSource,
  "sync_authenticated_response.role_missing_default_user",
);

console.log("Admin role-resolution diagnostic checks passed.");
