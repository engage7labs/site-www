import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const health = readFileSync("app/portal/health/page.tsx", "utf8");
const insights = readFileSync("app/portal/insights/page.tsx", "utf8");
const overview = readFileSync("app/portal/page.tsx", "utf8");
const darth = readFileSync("lib/darth.ts", "utf8");
const sidebar = readFileSync("components/portal/portal-sidebar.tsx", "utf8");
const healthDashboard = readFileSync("app/portal/health/health-dashboard.tsx", "utf8");
const healthPriority = readFileSync("lib/health-domain-priority.ts", "utf8");
const enDictionary = readFileSync("lib/i18n/dictionaries/en-IE.ts", "utf8");
const ptDictionary = readFileSync("lib/i18n/dictionaries/pt-BR.ts", "utf8");

assert.match(health, /ContextualIntelligenceCard/);
assert.match(health, /artifact=\{data\.contextual_intelligence\}/);
assert.match(insights, /locale === "pt-BR" \? \[\] : extractLegacyInsights/);
assert.match(insights, /!hasSolContextual && \(darthState \|\| darthClaim\)/);
assert.match(insights, /!hasSolContextual && heroBlock\?\.copy/);
assert.match(overview, /!hasSolContextual && \(/);
assert.match(overview, /OVERVIEW_DAILY_BRIEFING_COMPONENT/);
assert.match(darth, /resolved === "en-IE" \? copy\["en-IE"\] : null/);
assert.match(darth, /resolved === "en-IE" \? cta\.copy\["en-IE"\] : null/);
assert.match(healthPriority, /\["activity", "sleep", "recovery"\] as const/);
assert.ok(sidebar.indexOf('key: "activity"') < sidebar.indexOf('key: "sleep"'));
assert.ok(sidebar.indexOf('key: "sleep"') < sidebar.indexOf('key: "recovery"'));
assert.ok(
  overview.indexOf('debugLabel="OVERVIEW_ACTIVITY_CARD"') <
    overview.indexOf('debugLabel="OVERVIEW_SLEEP_CARD"'),
);
assert.ok(
  overview.indexOf('debugLabel="OVERVIEW_SLEEP_CARD"') <
    overview.indexOf('debugLabel="OVERVIEW_RECOVERY_CARD"'),
);
assert.match(health, /HEALTH_DOMAIN_PRIORITY\.map/);
assert.match(healthDashboard, /domainFilters\.activity/);
assert.match(enDictionary, /Longitudinal Activity, Sleep & Recovery/);
assert.match(ptDictionary, /Atividade, Sono e Recuperação ao longo do tempo/);
assert.match(insights, /eligible_insights/);
assert.match(insights, /SolInsightCard/);
assert.doesNotMatch(insights, /SOL · Your history in perspective/);
assert.match(enDictionary, /solTitle: "State of Life \(SOL\)"/);
assert.match(ptDictionary, /solTitle: "State of Life \(SOL\)"/);

console.log("Sprint 55 live-routing and PT-BR fail-closed checks passed.");
