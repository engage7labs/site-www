import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const {
  preservesCanonicalUser,
  shouldCreateUserForAuthIntent,
} = await import("../lib/auth-intent.ts");

assert.equal(shouldCreateUserForAuthIntent("login"), false);
assert.equal(shouldCreateUserForAuthIntent("register"), true);
assert.equal(preservesCanonicalUser("uuid-a", "uuid-a"), true);
assert.equal(preservesCanonicalUser("uuid-a", "uuid-b"), false);
assert.equal(preservesCanonicalUser(null, "uuid-b"), true);

const passwordless = await readFile(
  new URL("../components/shared/passwordless-login-form-fields.tsx", import.meta.url),
  "utf8",
);
assert.match(passwordless, /provider: "apple" \| "google"/);
assert.match(passwordless, /verifyOtp\(/);
assert.match(passwordless, /shouldCreateUserForAuthIntent\(mode\)/);

const onboarding = await readFile(
  new URL("../app/onboarding/onboarding-flow.tsx", import.meta.url),
  "utf8",
);
assert.match(onboarding, /engage7_onboarding_completed|\/api\/auth\/onboarding/);
assert.match(onboarding, /\/api\/proxy\/users\/profile/);
assert.match(onboarding, /router\.push\("\/portal\/upload"\)/);

const onboardingRoute = await readFile(
  new URL("../app/api/auth/onboarding/route.ts", import.meta.url),
  "utf8",
);
assert.match(onboardingRoute, /getUser\(\)/);
assert.match(onboardingRoute, /updateUser\(\{/);
assert.match(onboardingRoute, /engage7_onboarding_completed/);

const appleLink = await readFile(
  new URL("../app/api/auth/link-apple/route.ts", import.meta.url),
  "utf8",
);
assert.match(appleLink, /authenticated\.session\.user\.id !== appSession\.user_id/);
assert.match(appleLink, /linkIdentity\(\{/);
assert.match(appleLink, /provider: "apple"/);

console.log("Canonical identity, OTP intent, Apple linking, and authenticated onboarding checks passed.");
