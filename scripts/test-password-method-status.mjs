import assert from "node:assert/strict";

const { hasPasswordSignInMethod } = await import(
  "../lib/password-method-status.ts"
);

assert.equal(
  hasPasswordSignInMethod({
    app_metadata: { providers: ["email"] },
    identities: [],
  }),
  true,
);
assert.equal(
  hasPasswordSignInMethod({
    app_metadata: { providers: ["google"] },
    identities: [{ provider: "google" }],
    user_metadata: { engage7_password_enabled: true },
  }),
  true,
);
assert.equal(
  hasPasswordSignInMethod({
    app_metadata: { providers: ["google"] },
    identities: [{ provider: "google" }],
  }),
  false,
);

console.log("Password sign-in method status checks passed.");
