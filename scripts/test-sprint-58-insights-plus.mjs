import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseInsightVisualEvidence } from "../lib/insight-visual-evidence.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

const trend = {
  type: "metric_trend",
  title: "Sleep duration",
  caption: "Reliable yearly aggregates.",
  series: [{
    metric: "sleep_duration",
    label: "Sleep duration",
    unit: "hours",
    points: [
      { date: "2025-01-01", value: 6.9 },
      { date: "2026-01-01", value: 7.1 },
    ],
  }],
  sample_count: 120,
};

assert.equal(parseInsightVisualEvidence(undefined), null);
assert.equal(parseInsightVisualEvidence({ ...trend, series: "invalid" }), null);
assert.equal(parseInsightVisualEvidence({ ...trend, series: [{ ...trend.series[0], points: trend.series[0].points.toReversed() }] }), null);
assert.equal(parseInsightVisualEvidence({ ...trend, series: [{ ...trend.series[0], points: [{ date: "2025-01-01", value: Number.NaN }] }] }), null);
assert.equal(parseInsightVisualEvidence(trend)?.type, "metric_trend");

const comparison = {
  type: "period_comparison",
  title: "Recent activity changes",
  caption: "Compatible changes.",
  series: [
    { metric: "steps", label: "Daily steps", unit: "percent", points: [{ period: "recent_vs_previous", period_label: "Recent vs previous", value: 20 }] },
    { metric: "distance", label: "Distance", unit: "percent", points: [{ period: "recent_vs_previous", period_label: "Recent vs previous", value: 15 }] },
  ],
  sample_count: 56,
};
assert.equal(parseInsightVisualEvidence(comparison)?.series.length, 2);
assert.equal(parseInsightVisualEvidence({ ...comparison, series: [comparison.series[0], { ...comparison.series[1], unit: "kilometers" }] }), null);

const baseline = {
  type: "baseline_comparison",
  title: "Sleep consistency",
  caption: "Recent versus history.",
  series: [{ metric: "sleep_duration_variability", label: "Sleep variability", unit: "percent", points: [{ date: "2026-07-30", value: 4.2 }] }],
  reference: { type: "baseline", label: "Personal history", value: 8.4, unit: "percent" },
  sample_count: 90,
};
assert.equal(parseInsightVisualEvidence(baseline)?.reference?.type, "baseline");
assert.equal(parseInsightVisualEvidence({ ...baseline, reference: undefined }), null);

const page = source("app/portal/insights/page.tsx");
const component = source("components/portal/insight-visual-evidence-chart.tsx");
const english = source("lib/i18n/dictionaries/en-IE.ts");
const portuguese = source("lib/i18n/dictionaries/pt-BR.ts");
assert.match(page, /evidence=\{insight\.visual_evidence\}/);
assert.match(page, /InsightVisualEvidenceChart[\s\S]*portal\.insightsPage/);
assert.equal((page.match(/InsightsSupportingSignals/g) ?? []).length, 0);
assert.match(component, /height=\{128\}/);
assert.match(component, /ariaLabel=\{accessibilitySummary/);
assert.match(component, /if \(!evidence \|\| !option\) return null/);
assert.match(english, /visualEvidenceSampleCount/);
assert.match(portuguese, /visualEvidenceSampleCount/);

console.log("Sprint 58 Insights+ Web regressions passed.");
