import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync("fixtures/darth_v3_parity.json", "utf8"));
const source = readFileSync("components/portal/contextual-intelligence-card.tsx", "utf8");
const page = readFileSync("app/portal/insights/page.tsx", "utf8");

assert.equal(fixture.fixture_version, "darth_v3_parity.v1");
assert.equal(fixture.cases.length, 13);
for (const item of fixture.cases) {
  assert.equal(item.contract_version, "darth.v3");
  assert.equal(item.algorithm_version, "darth_algorithm.v3.0.0");
  assert.ok(item.contextual.headline);
  assert.ok(item.contextual.safe_action);
  assert.ok(item.contextual.what_not_to_overreact_to);
}
assert.match(source, /artifact\?\.presentation\?\.\[canonicalLocale\]/);
assert.match(page, /darthPayload\?\.contextual_intelligence/);
assert.doesNotMatch(page, /<CompareImproveBlock/);

console.log("Sprint 54 DARTH v3 Web parity fixture passed.");
