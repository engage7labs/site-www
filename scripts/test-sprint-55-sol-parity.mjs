import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync("fixtures/darth_sol_parity.json", "utf8"));
const card = readFileSync("components/portal/contextual-intelligence-card.tsx", "utf8");
const overview = readFileSync("app/portal/page.tsx", "utf8");
const insights = readFileSync("app/portal/insights/page.tsx", "utf8");

assert.equal(fixture.fixture_version, "darth_sol_parity.v1");
assert.equal(fixture.cases.length, 7);
for (const item of fixture.cases) {
  assert.equal(item.contract_version, "darth.v4");
  assert.equal(item.algorithm_version, "darth_algorithm.v4.0.0");
  for (const field of ["headline", "explanation", "comparison", "evidence", "action", "restraint", "confidence"]) {
    assert.ok(item.contextual[field]);
  }
}
assert.match(card, /copy\.evidence/);
assert.match(card, /copy\.what_not_to_overreact_to/);
assert.match(overview, /ContextualIntelligenceCard/);
assert.match(overview, /data\?\.contextual_intelligence/);
assert.match(insights, /darthPayload\?\.contextual_intelligence/);
assert.doesNotMatch(insights, /<CompareImproveBlock/);

console.log("Sprint 55 SOL Web parity fixture passed.");
