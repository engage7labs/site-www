/**
 * Compare & Improve Engine — Sprint 17.5
 *
 * Deterministic intelligence layer that translates user health data into:
 *   1) Comparisons  — user metrics vs own baseline + heuristic ranges
 *   2) Interpretations — cross-metric relationships
 *   3) Improvements  — small, testable, grounded suggestions
 *
 * Data sources:
 *   - portal-overview  (sleep_score, recovery_trend, data_completeness, uploads)
 *   - portal-trends    (sleep, hr, hrv, steps arrays + correlations, baseline, volatility)
 *   - portal-analyses  (latest analysis sections_json)
 *
 * No ML. No mocks. No new backend contracts.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;
type CompareImproveCopy =
  typeof import("@/lib/i18n/dictionaries/en-IE").enIE.portal.compareImprove;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompareItem {
  label: string;
  userValue: string;
  referenceRange: string;
  status: "good" | "attention" | "neutral";
  detail: string;
}

export interface InterpretItem {
  headline: string;
  body: string;
}

export interface ImproveItem {
  suggestion: string;
  reason: string;
}

export interface CompareImproveResult {
  comparisons: CompareItem[];
  interpretations: InterpretItem[];
  improvements: ImproveItem[];
  hasData: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function getTrendValues(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => safeNum((entry as { value?: unknown })?.value))
    .filter((n): n is number => n != null);
}

function median(input: unknown): number | null {
  const values = getTrendValues(input);
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Heuristic reference ranges (simple, non-clinical)
// ---------------------------------------------------------------------------
const RANGES = {
  sleep: { low: 6.5, high: 9, unit: "h" },
  hr: { low: 50, high: 85, unit: "bpm" },
  hrv: { low: 25, high: 100, unit: "ms" },
  steps: { low: 5000, high: 12000, unit: "" },
} as const;

// ---------------------------------------------------------------------------
// 1. COMPARISONS
// ---------------------------------------------------------------------------

function buildComparisons(
  overview: AnyRecord | null,
  trends: AnyRecord | null,
  copy: CompareImproveCopy
): CompareItem[] {
  const items: CompareItem[] = [];

  // Sleep
  const sleepVal = safeNum(overview?.sleep_score);
  if (sleepVal != null) {
    const r = RANGES.sleep;
    const status =
      sleepVal >= r.low && sleepVal <= r.high ? "good" : "attention";
    items.push({
      label: copy.labels.sleep,
      userValue: `${round1(sleepVal)}${r.unit}`,
      referenceRange: `${r.low}–${r.high}${r.unit}`,
      status,
      detail:
        status === "good"
          ? copy.details.sleepGood
          : sleepVal < r.low
          ? copy.details.sleepLow
          : copy.details.sleepHigh,
    });
  }

  // Resting HR
  const hrMed = median(trends?.trends?.hr);
  if (hrMed != null) {
    const r = RANGES.hr;
    const status = hrMed >= r.low && hrMed <= r.high ? "good" : "attention";
    items.push({
      label: copy.labels.hr,
      userValue: `${Math.round(hrMed)} ${r.unit}`,
      referenceRange: `${r.low}–${r.high} ${r.unit}`,
      status,
      detail:
        status === "good"
          ? copy.details.hrGood
          : hrMed < r.low
          ? copy.details.hrLow
          : copy.details.hrHigh,
    });
  }

  // HRV
  const hrvMed =
    safeNum(overview?.recovery_trend) ?? median(trends?.trends?.hrv);
  if (hrvMed != null && hrvMed > 0) {
    const r = RANGES.hrv;
    const status = hrvMed >= r.low && hrvMed <= r.high ? "good" : "attention";
    items.push({
      label: copy.labels.hrv,
      userValue: `${Math.round(hrvMed)} ${r.unit}`,
      referenceRange: `${r.low}–${r.high} ${r.unit}`,
      status,
      detail:
        status === "good"
          ? copy.details.hrvGood
          : hrvMed < r.low
          ? copy.details.hrvLow
          : copy.details.hrvHigh,
    });
  }

  // Steps
  const stepsMed = median(trends?.trends?.steps);
  if (stepsMed != null) {
    const r = RANGES.steps;
    const status =
      stepsMed >= r.low && stepsMed <= r.high ? "good" : "attention";
    items.push({
      label: copy.labels.steps,
      userValue: `${Math.round(stepsMed).toLocaleString()}`,
      referenceRange: `${r.low.toLocaleString()}–${r.high.toLocaleString()}`,
      status,
      detail:
        status === "good"
          ? copy.details.stepsGood
          : stepsMed < r.low
          ? copy.details.stepsLow
          : copy.details.stepsHigh,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// 2. INTERPRETATIONS
// ---------------------------------------------------------------------------

function buildInterpretations(
  overview: AnyRecord | null,
  trends: AnyRecord | null,
  sections: AnyRecord | null,
  copy: CompareImproveCopy
): InterpretItem[] {
  const items: InterpretItem[] = [];

  // Sleep vs Recovery
  const sleepVal = safeNum(overview?.sleep_score);
  const hrvVal = safeNum(overview?.recovery_trend);
  if (sleepVal != null && hrvVal != null) {
    if (sleepVal >= 7 && hrvVal >= 30) {
      items.push({
        headline: copy.interpretations.sleepRecoveryAligned,
        body: copy.interpretations.sleepRecoveryAlignedBody,
      });
    } else if (sleepVal < 6.5 && hrvVal < 30) {
      items.push({
        headline: copy.interpretations.sleepRecoveryPressure,
        body: copy.interpretations.sleepRecoveryPressureBody,
      });
    } else if (sleepVal >= 7 && hrvVal < 30) {
      items.push({
        headline: copy.interpretations.sleepGoodRecoveryLag,
        body: copy.interpretations.sleepGoodRecoveryLagBody,
      });
    }
  }

  // Activity vs HR/HRV
  const stepsMed = median(trends?.trends?.steps);
  const hrMed = median(trends?.trends?.hr);
  if (stepsMed != null && hrMed != null) {
    if (stepsMed >= 7000 && hrMed <= 70) {
      items.push({
        headline: copy.interpretations.activeEfficient,
        body: copy.interpretations.activeEfficientBody,
      });
    } else if (stepsMed < 5000 && hrMed > 75) {
      items.push({
        headline: copy.interpretations.lowerActivityHigherHr,
        body: copy.interpretations.lowerActivityHigherHrBody,
      });
    }
  }

  // Variability pattern (from trends or sections)
  const sleepVol =
    safeNum(sections?.volatility?.sleep_hours?.cv) ??
    safeNum(trends?.trends?.volatility?.sleep_cv);
  const stepsVol =
    safeNum(sections?.volatility?.total_steps?.cv) ??
    safeNum(trends?.trends?.volatility?.steps_cv);
  if (sleepVol != null && stepsVol != null) {
    if (sleepVol > 20 && stepsVol > 40) {
      items.push({
        headline: copy.interpretations.variablePatterns,
        body: copy.interpretations.variablePatternsBody,
      });
    } else if (sleepVol < 15 && stepsVol < 30) {
      items.push({
        headline: copy.interpretations.consistentPattern,
        body: copy.interpretations.consistentPatternBody,
      });
    }
  }

  // Correlation-based interpretation (from sections)
  const sleepHrCorr = safeNum(sections?.correlations?.sleep_hours?.hr_mean);
  if (sleepHrCorr != null && Math.abs(sleepHrCorr) > 0.2) {
    items.push({
      headline: copy.interpretations.sleepAffectsHr,
      body: sleepHrCorr < 0
        ? copy.interpretations.sleepAffectsHrLower
        : copy.interpretations.sleepAffectsHrHigher,
    });
  }

  return items.slice(0, 3);
}

// ---------------------------------------------------------------------------
// 3. IMPROVEMENTS
// ---------------------------------------------------------------------------

function buildImprovements(
  overview: AnyRecord | null,
  trends: AnyRecord | null,
  sections: AnyRecord | null,
  copy: CompareImproveCopy
): ImproveItem[] {
  const items: ImproveItem[] = [];

  const sleepVal = safeNum(overview?.sleep_score);
  const hrvVal = safeNum(overview?.recovery_trend);
  const stepsMed = median(trends?.trends?.steps);
  const hrMed = median(trends?.trends?.hr);
  const sleepVol = safeNum(sections?.volatility?.sleep_hours?.cv);

  // Sleep-based suggestions
  if (sleepVal != null && sleepVal < 6.5) {
    items.push({
      suggestion: copy.improvements.earlierBedtime,
      reason: copy.improvements.earlierBedtimeReason
        .replace("{current}", String(round1(sleepVal)))
        .replace("{target}", String(round1(sleepVal + 0.3))),
    });
  } else if (sleepVol != null && sleepVol > 20) {
    items.push({
      suggestion: copy.improvements.consistentBedtime,
      reason: copy.improvements.consistentBedtimeReason,
    });
  }

  // Activity-based suggestions
  if (stepsMed != null && stepsMed < 5000) {
    items.push({
      suggestion: copy.improvements.lunchWalk,
      reason: copy.improvements.lunchWalkReason.replace(
        "{steps}",
        Math.round(stepsMed).toLocaleString(),
      ),
    });
  } else if (
    stepsMed != null &&
    stepsMed > 12000 &&
    hrMed != null &&
    hrMed > 75
  ) {
    items.push({
      suggestion: copy.improvements.recoveryBalance,
      reason: copy.improvements.recoveryBalanceReason,
    });
  }

  // Recovery-based suggestions
  if (hrvVal != null && hrvVal < 25) {
    items.push({
      suggestion: copy.improvements.slowBreathing,
      reason: copy.improvements.slowBreathingReason,
    });
  } else if (
    hrvVal != null &&
    hrvVal > 60 &&
    sleepVal != null &&
    sleepVal >= 7
  ) {
    items.push({
      suggestion: copy.improvements.maintainRoutine,
      reason: copy.improvements.maintainRoutineReason,
    });
  }

  // HR-based
  if (hrMed != null && hrMed > 80) {
    items.push({
      suggestion: copy.improvements.hydrationStress,
      reason: copy.improvements.hydrationStressReason.replace(
        "{hr}",
        String(Math.round(hrMed)),
      ),
    });
  }

  // General fallback if no specific insights
  if (items.length === 0 && (overview?.uploads ?? 0) > 0) {
    items.push({
      suggestion: copy.improvements.keepUploading,
      reason: copy.improvements.keepUploadingReason,
    });
  }

  return items.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateCompareImprove(
  overview: AnyRecord | null,
  trends: AnyRecord | null,
  sections: AnyRecord | null,
  copy: CompareImproveCopy
): CompareImproveResult {
  const safeOverview =
    overview && typeof overview === "object" ? overview : ({} as AnyRecord);
  const safeTrends =
    trends && typeof trends === "object" ? trends : ({} as AnyRecord);
  const safeSections =
    sections && typeof sections === "object" ? sections : ({} as AnyRecord);

  const comparisons = buildComparisons(safeOverview, safeTrends, copy);
  const interpretations = buildInterpretations(
    safeOverview,
    safeTrends,
    safeSections,
    copy,
  );
  const improvements = buildImprovements(
    safeOverview,
    safeTrends,
    safeSections,
    copy,
  );

  return {
    comparisons,
    interpretations,
    improvements,
    hasData:
      comparisons.length > 0 ||
      interpretations.length > 0 ||
      improvements.length > 0,
  };
}
