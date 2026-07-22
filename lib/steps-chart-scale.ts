export const MINIMUM_STEPS_VISUAL_CEILING = 1_000;
export const MINIMUM_CLIPPING_POINT_COUNT = 7;
export const MAXIMUM_VALID_DAILY_STEPS = 200_000;

export interface StepsScaleInputPoint {
  date: string;
  value: unknown;
}

export interface StepsScalePoint {
  date: string;
  realValue: number | null;
  renderedValue: number | null;
  isClipped: boolean;
}

export interface StepsScaleModel {
  points: StepsScalePoint[];
  mean: number | null;
  visualCeiling: number;
  validPointCount: number;
  clippedPointCount: number;
}

export function validDailySteps(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAXIMUM_VALID_DAILY_STEPS
    ? value
    : null;
}

/**
 * Linear-interpolated percentile (R-7 / Excel PERCENTILE.INC style).
 * The sorted position is (n - 1) * percentile and adjacent values are
 * interpolated when that position is fractional.
 */
export function linearInterpolatedPercentile(
  values: readonly number[],
  percentile: number,
): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const boundedPercentile = Math.min(1, Math.max(0, percentile));
  const position = (sorted.length - 1) * boundedPercentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  if (lowerIndex === upperIndex) return sorted[lowerIndex];
  const fraction = position - lowerIndex;
  return (
    sorted[lowerIndex] +
    (sorted[upperIndex] - sorted[lowerIndex]) * fraction
  );
}

/** Round upward to a stable, Steps-friendly axis ceiling. */
export function roundStepsCeilingUp(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return MINIMUM_STEPS_VISUAL_CEILING;
  }

  const step =
    value <= 1_000
      ? 100
      : value <= 10_000
        ? 1_000
        : value <= 25_000
          ? 5_000
          : value <= 100_000
            ? 10_000
            : 50_000;
  return Math.max(
    MINIMUM_STEPS_VISUAL_CEILING,
    Math.ceil(value / step) * step,
  );
}

function arithmeticMean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function enforceStepsClippingRatioSafeguard(
  realValues: readonly number[],
  initialCeiling: number,
): number {
  if (realValues.length === 0) return roundStepsCeilingUp(initialCeiling);
  const allowedClippedCount = Math.floor(realValues.length * 0.1);
  const initiallyClipped = realValues.filter(
    (value) => value > initialCeiling,
  ).length;
  if (initiallyClipped <= allowedClippedCount) return initialCeiling;

  const sorted = [...realValues].sort((left, right) => left - right);
  const safeguardIndex = Math.max(
    0,
    sorted.length - allowedClippedCount - 1,
  );
  const raisedCeiling = roundStepsCeilingUp(
    Math.max(initialCeiling, sorted[safeguardIndex]),
  );
  return realValues.filter((value) => value > raisedCeiling).length <=
    allowedClippedCount
    ? raisedCeiling
    : roundStepsCeilingUp(sorted[sorted.length - 1]);
}

export function buildStepsScaleModel(
  inputPoints: readonly StepsScaleInputPoint[],
): StepsScaleModel {
  const realValues = inputPoints
    .map((point) => validDailySteps(point.value))
    .filter((value): value is number => value !== null);
  const validPointCount = realValues.length;
  const mean = arithmeticMean(realValues);
  const realMaximum = validPointCount > 0 ? Math.max(...realValues) : 0;

  let visualCeiling: number;
  if (validPointCount < MINIMUM_CLIPPING_POINT_COUNT) {
    visualCeiling = roundStepsCeilingUp(realMaximum);
  } else {
    const p95 = linearInterpolatedPercentile(realValues, 0.95) ?? realMaximum;
    const meanCandidate = (mean ?? 0) * 2;
    visualCeiling = roundStepsCeilingUp(Math.max(p95, meanCandidate));

    visualCeiling = enforceStepsClippingRatioSafeguard(
      realValues,
      visualCeiling,
    );
  }

  const points = inputPoints.map(({ date, value }) => {
    const realValue = validDailySteps(value);
    if (realValue === null) {
      return { date, realValue: null, renderedValue: null, isClipped: false };
    }
    return {
      date,
      realValue,
      renderedValue: Math.min(realValue, visualCeiling),
      isClipped: realValue > visualCeiling,
    };
  });

  return {
    points,
    mean,
    visualCeiling,
    validPointCount,
    clippedPointCount: points.filter((point) => point.isClipped).length,
  };
}
