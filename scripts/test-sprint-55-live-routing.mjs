import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const health = readFileSync("app/portal/health/page.tsx", "utf8");
const insights = readFileSync("app/portal/insights/page.tsx", "utf8");
const darth = readFileSync("lib/darth.ts", "utf8");

assert.match(health, /ContextualIntelligenceCard/);
assert.match(health, /artifact=\{data\.contextual_intelligence\}/);
assert.match(insights, /locale === "pt-BR" \? \[\] : extractLegacyInsights/);
assert.match(insights, /!hasSolContextual && \(darthState \|\| darthClaim\)/);
assert.match(insights, /!hasSolContextual && heroBlock\?\.copy/);
assert.match(darth, /resolved === "en-IE" \? copy\["en-IE"\] : null/);
assert.match(darth, /resolved === "en-IE" \? cta\.copy\["en-IE"\] : null/);

console.log("Sprint 55 live-routing and PT-BR fail-closed checks passed.");
