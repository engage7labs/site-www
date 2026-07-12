import assert from "node:assert/strict";

const { classifyPasswordUpdateFailure } = await import(
  "../lib/password-update-error.ts"
);

assert.deepEqual(classifyPasswordUpdateFailure({ code: "weak_password" }), {
  errorCode: "weak_password",
  status: 422,
});
assert.deepEqual(classifyPasswordUpdateFailure({ code: "other" }), {
  errorCode: "password_update_failed",
  status: 409,
});
assert.deepEqual(classifyPasswordUpdateFailure(null), {
  errorCode: "password_update_failed",
  status: 409,
});

console.log("Password-update error classification checks passed.");
