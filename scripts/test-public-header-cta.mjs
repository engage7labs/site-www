import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { resolvePublicHeaderCta } = await import("../lib/public-header-cta.ts");

assert.deepEqual(resolvePublicHeaderCta(false), {
  href: "/login?next=/onboarding",
  kind: "get-started",
});
assert.deepEqual(resolvePublicHeaderCta(true), {
  href: "/portal",
  kind: "portal",
});

const headerSource = await readFile(
  new URL("../components/shared/site-header.tsx", import.meta.url),
  "utf8",
);

assert.equal(
  (headerSource.match(/data-testid="site-header-primary-cta"/g) ?? []).length,
  1,
  "the public header must render a single session-aware CTA",
);
assert.match(
  headerSource,
  /primaryCta\.kind === "portal"[\s\S]*?bg-black text-white/,
  "the authenticated Portal CTA must use the black Login color pattern",
);
assert.doesNotMatch(
  headerSource,
  /PasswordlessLoginFormFields|t\.nav\.login/,
  "the separate Login CTA and modal must not remain in the header",
);

console.log("Public header CTA checks passed.");
