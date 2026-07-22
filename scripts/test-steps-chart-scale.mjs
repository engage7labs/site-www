import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const {
  buildStepsScaleModel,
  enforceStepsClippingRatioSafeguard,
  linearInterpolatedPercentile,
  roundStepsCeilingUp,
} = await import("../lib/steps-chart-scale.ts");

const points = (values) =>
  values.map((value, index) => ({
    date: `2024-01-${String(index + 1).padStart(2, "0")}`,
    value,
  }));

const oneOutlier = buildStepsScaleModel(
  points([...Array(19).fill(1_000), 20_000]),
);
assert.equal(oneOutlier.mean, 1_950);
assert.ok(oneOutlier.visualCeiling < 20_000);
assert.equal(oneOutlier.points.at(-1).realValue, 20_000);
assert.equal(
  oneOutlier.points.at(-1).renderedValue,
  oneOutlier.visualCeiling,
);
assert.equal(oneOutlier.points.at(-1).isClipped, true);
assert.ok(
  oneOutlier.points.every(
    (point) =>
      point.renderedValue === null ||
      point.renderedValue <= oneOutlier.visualCeiling,
  ),
);

const severalOutliers = buildStepsScaleModel(
  points([...Array(95).fill(1_000), 20_000, 22_000, 25_000, 27_000, 29_000]),
);
assert.ok(severalOutliers.clippedPointCount > 0);
assert.ok(severalOutliers.visualCeiling < 29_000);

assert.ok(
  Math.abs(linearInterpolatedPercentile([0, 10, 20, 30], 0.95) - 28.5) <
    Number.EPSILON * 20,
);
assert.equal(linearInterpolatedPercentile([30, 0, 20, 10], 0.5), 15);
assert.equal(roundStepsCeilingUp(5_726), 6_000);
assert.equal(roundStepsCeilingUp(6_001), 7_000);
assert.equal(roundStepsCeilingUp(9_420), 10_000);
assert.equal(roundStepsCeilingUp(14_300), 15_000);
assert.equal(roundStepsCeilingUp(27_100), 30_000);

const safeguardValues = [...Array(80).fill(1_000), ...Array(20).fill(9_000)];
const safeguardedCeiling = enforceStepsClippingRatioSafeguard(
  safeguardValues,
  2_000,
);
assert.equal(safeguardedCeiling, 9_000);
assert.ok(
  safeguardValues.filter((value) => value > safeguardedCeiling).length <= 10,
);

const shortRange = buildStepsScaleModel(points([100, 200, 300, 400, 50_000]));
assert.equal(shortRange.clippedPointCount, 0);
assert.ok(shortRange.visualCeiling >= 50_000);

const equalValues = buildStepsScaleModel(points(Array(10).fill(5_000)));
assert.ok(equalValues.visualCeiling > 0);
assert.equal(equalValues.mean, 5_000);
assert.equal(equalValues.clippedPointCount, 0);

const zeroValues = buildStepsScaleModel(points(Array(10).fill(0)));
assert.equal(zeroValues.mean, 0);
assert.equal(zeroValues.visualCeiling, 1_000);

const invalidValues = buildStepsScaleModel(
  points([null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1, 200_001, 1_250.5]),
);
assert.equal(invalidValues.validPointCount, 1);
assert.equal(invalidValues.mean, 1_250.5);
assert.equal(invalidValues.points.at(-1).realValue, 1_250.5);

const historicalValues = [
  ...Array.from({ length: 223 }, (_, index) => 2_200 + (index % 8) * 100),
  20_000,
  25_000,
  29_412,
];
const historical = buildStepsScaleModel(points(historicalValues));
assert.ok(historical.mean > 2_750 && historical.mean < 2_950);
assert.ok(historical.visualCeiling <= 7_000);
assert.ok(historical.clippedPointCount >= 3);
assert.equal(historical.validPointCount, 226);

const source = await readFile(
  new URL("../app/portal/health/health-dashboard.tsx", import.meta.url),
  "utf8",
);
assert.match(source, /buildStepsScaleModel/);
assert.match(source, /stepsScale\.mean/);
assert.match(source, /data: \[\{ yAxis: scale\.mean \}\]/);
assert.match(source, /realValue: point\.realValue/);
assert.match(source, /datum\.realValue/);
assert.match(source, /symbol: "triangle"/);
assert.match(source, /stepsScale\.clippedPointCount > 0/);
assert.match(source, /stepsAccessiblePointClipped/);
assert.match(source, /lineChartOption\(\s*points,/);
assert.doesNotMatch(source, /STEP_DISPLAY_CAP/);
assert.doesNotMatch(source, /new Date\(point\.date\)/);

const en = await readFile(
  new URL("../lib/i18n/dictionaries/en-IE.ts", import.meta.url),
  "utf8",
);
const pt = await readFile(
  new URL("../lib/i18n/dictionaries/pt-BR.ts", import.meta.url),
  "utf8",
);
assert.match(en, /Extreme values are visually limited/);
assert.match(pt, /Valores extremos são limitados visualmente/);

console.log("Steps chart scale tests passed");
