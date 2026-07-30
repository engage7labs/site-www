import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { resolvePublicHeaderSecondaryCta } = await import("../lib/public-header-cta.ts");

assert.deepEqual(resolvePublicHeaderSecondaryCta(false), {
  href: "/login",
  kind: "sign-in",
});
assert.deepEqual(resolvePublicHeaderSecondaryCta(true), {
  href: "/portal",
  kind: "portal",
});

const headerSource = await readFile(
  new URL("../components/shared/site-header.tsx", import.meta.url),
  "utf8",
);

assert.equal(
  (headerSource.match(/data-testid="site-header-get-started"/g) ?? []).length,
  1,
  "the public header must always render one Get started CTA",
);
assert.match(
  headerSource,
  /href="\/login\?next=\/onboarding"[\s\S]*?trackPublicGetStartedClicked/,
  "Get started must retain its onboarding destination and telemetry",
);
assert.match(
  headerSource,
  /sessionChecked \? \([\s\S]*?data-testid="site-header-secondary-cta"/,
  "the session-dependent secondary CTA must not render while session state is loading",
);
assert.match(
  headerSource,
  /secondaryCta\.kind === "portal"[\s\S]*?bg-black text-white/,
  "the authenticated Portal CTA must use the black Login color pattern",
);
assert.match(
  headerSource,
  /secondaryCta\.kind === "portal" \? t\.nav\.portal : t\.nav\.signIn/,
  "the secondary CTA must be Portal for authenticated visitors and Sign in otherwise",
);
assert.doesNotMatch(
  headerSource,
  /PasswordlessLoginFormFields|DialogTrigger/,
  "the header must link to the existing sign-in flow instead of embedding another auth flow",
);

console.log("Public header action checks passed.");
