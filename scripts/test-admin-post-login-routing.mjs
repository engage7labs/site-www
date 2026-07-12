import assert from "node:assert/strict";

const { postLoginDestination } = await import("../lib/post-login-routing.ts");

assert.equal(
  postLoginDestination({ requireAdmin: true, redirectTo: "/portal" }),
  "/admin",
  "explicit Admin mode must always retain the Admin destination",
);
assert.equal(
  postLoginDestination({ requireAdmin: false, redirectTo: "/portal" }),
  "/portal",
  "normal login must retain the normal Portal destination",
);

console.log("Admin post-login routing checks passed.");
