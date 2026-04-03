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

function median(arr: { value: number }[] | undefined): number | null {
  if (!arr || arr.length === 0) return null;
  const sorted = arr.map((p) => p.value).sort((a, b) => a - b);
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
  sleep: { low: 6.5, high: 9, unit: "h", label: "Sleep duration" },
  hr: { low: 50, high: 85, unit: "bpm", label: "Resting heart rate" },
  hrv: { low: 25, high: 100, unit: "ms", label: "Heart rate variability" },
  steps: { low: 5000, high: 12000, unit: "", label: "Daily steps" },
} as const;

// ---------------------------------------------------------------------------
// 1. COMPARISONS
// ---------------------------------------------------------------------------

function buildComparisons(
  overview: AnyRecord | null,
  trends: AnyRecord | null
): CompareItem[] {
  const items: CompareItem[] = [];

  // Sleep
  const sleepVal = safeNum(overview?.sleep_score);
  if (sleepVal != null) {
    const r = RANGES.sleep;
    const status =
      sleepVal >= r.low && sleepVal <= r.high ? "good" : "attention";
    items.push({
      label: r.label,
      userValue: `${round1(sleepVal)}${r.unit}`,
      referenceRange: `${r.low}–${r.high}${r.unit}`,
      status,
      detail:
        status === "good"
          ? "Your sleep duration is within a healthy range."
          : sleepVal < r.low
          ? "Your sleep is shorter than the typical healthy range."
          : "Your sleep is longer than what most people need.",
    });
  }

  // Resting HR
  const hrMed = median(trends?.trends?.hr);
  if (hrMed != null) {
    const r = RANGES.hr;
    const status = hrMed >= r.low && hrMed <= r.high ? "good" : "attention";
    items.push({
      label: r.label,
      userValue: `${Math.round(hrMed)} ${r.unit}`,
      referenceRange: `${r.low}–${r.high} ${r.unit}`,
      status,
      detail:
        status === "good"
          ? "Your resting heart rate sits in a comfortable range."
          : hrMed < r.low
          ? "Your resting heart rate is lower than average — often a sign of good fitness."
          : "Your resting heart rate is on the higher side. Stress, dehydration, or fitness can influence this.",
    });
  }

  // HRV
  const hrvMed =
    safeNum(overview?.recovery_trend) ?? median(trends?.trends?.hrv);
  if (hrvMed != null && hrvMed > 0) {
    const r = RANGES.hrv;
    const status = hrvMed >= r.low && hrvMed <= r.high ? "good" : "attention";
    items.push({
      label: r.label,
      userValue: `${Math.round(hrvMed)} ${r.unit}`,
      referenceRange: `${r.low}–${r.high} ${r.unit}`,
      status,
      detail:
        status === "good"
          ? "Your HRV suggests a well-balanced nervous system."
          : hrvMed < r.low
          ? "Your HRV is on the lower side, which can reflect accumulated stress."
          : "Your HRV is notably high — typically a sign of strong recovery capacity.",
    });
  }

  // Steps
  const stepsMed = median(trends?.trends?.steps);
  if (stepsMed != null) {
    const r = RANGES.steps;
    const status =
      stepsMed >= r.low && stepsMed <= r.high ? "good" : "attention";
    items.push({
      label: r.label,
      userValue: `${Math.round(stepsMed).toLocaleString()}`,
      referenceRange: `${r.low.toLocaleString()}–${r.high.toLocaleString()}`,
      status,
      detail:
        status === "good"
          ? "Your daily activity sits in a sustainable range."
          : stepsMed < r.low
          ? "Your step count is below the commonly recommended range."
          : "You're very active — make sure recovery keeps pace.",
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
  sections: AnyRecord | null
): InterpretItem[] {
  const items: InterpretItem[] = [];

  // Sleep vs Recovery
  const sleepVal = safeNum(overview?.sleep_score);
  const hrvVal = safeNum(overview?.recovery_trend);
  if (sleepVal != null && hrvVal != null) {
    if (sleepVal >= 7 && hrvVal >= 30) {
      items.push({
        headline: "Sleep and recovery are aligned",
        body: "Your sleep duration supports your nervous system recovery. This is a strong positive signal.",
      });
    } else if (sleepVal < 6.5 && hrvVal < 30) {
      items.push({
        headline: "Both sleep and recovery are under pressure",
        body: "Shorter sleep paired with lower HRV suggests your body may benefit from more consistent rest.",
      });
    } else if (sleepVal >= 7 && hrvVal < 30) {
      items.push({
        headline: "Good sleep but recovery lags behind",
        body: "You're sleeping enough, but your HRV is still low. Other factors like stress or inconsistent timing may be involved.",
      });
    }
  }

  // Activity vs HR/HRV
  const stepsMed = median(trends?.trends?.steps);
  const hrMed = median(trends?.trends?.hr);
  if (stepsMed != null && hrMed != null) {
    if (stepsMed >= 7000 && hrMed <= 70) {
      items.push({
        headline: "Active lifestyle with efficient cardiovascular response",
        body: "Your daily movement is solid and your resting heart rate stays low — a sign of good cardiovascular fitness.",
      });
    } else if (stepsMed < 5000 && hrMed > 75) {
      items.push({
        headline: "Lower activity and higher resting heart rate",
        body: "Less daily movement tends to pair with higher resting heart rate. Small increases in activity can help.",
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
        headline: "Both sleep and activity patterns are variable",
        body: "Your day-to-day routine swings more than average. Stabilizing either sleep or movement can create a positive ripple across both.",
      });
    } else if (sleepVol < 15 && stepsVol < 30) {
      items.push({
        headline: "Consistent lifestyle pattern",
        body: "Both your sleep and activity are steady from day to day. This consistency supports reliable energy and recovery.",
      });
    }
  }

  // Correlation-based interpretation (from sections)
  const sleepHrCorr = safeNum(sections?.correlations?.sleep_hours?.hr_mean);
  if (sleepHrCorr != null && Math.abs(sleepHrCorr) > 0.2) {
    const direction =
      sleepHrCorr < 0
        ? "more sleep tends to lower your heart rate"
        : "more sleep is associated with a slightly higher heart rate";
    items.push({
      headline: "Sleep has a measurable effect on your heart rate",
      body: `In your data, ${direction}. This connection is strong enough to track over time.`,
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
  sections: AnyRecord | null
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
      suggestion: "Try going to bed 20 minutes earlier this week",
      reason: `Your median sleep is ${round1(
        sleepVal
      )}h — even a small shift toward ${round1(
        sleepVal + 0.3
      )}h can improve how you feel.`,
    });
  } else if (sleepVol != null && sleepVol > 20) {
    items.push({
      suggestion: "Pick a consistent bedtime for the next 5 days",
      reason:
        "Your sleep timing varies quite a bit. A fixed bedtime, even on weekends, helps stabilize your energy.",
    });
  }

  // Activity-based suggestions
  if (stepsMed != null && stepsMed < 5000) {
    items.push({
      suggestion: "Add a 10-minute walk after lunch",
      reason: `Your daily steps average around ${Math.round(
        stepsMed
      ).toLocaleString()}. A short walk is the easiest way to boost that.`,
    });
  } else if (
    stepsMed != null &&
    stepsMed > 12000 &&
    hrMed != null &&
    hrMed > 75
  ) {
    items.push({
      suggestion: "Balance high activity with deliberate recovery time",
      reason:
        "You move a lot but your resting heart rate suggests your body may need more downtime.",
    });
  }

  // Recovery-based suggestions
  if (hrvVal != null && hrvVal < 25) {
    items.push({
      suggestion: "Try 5 minutes of slow breathing before bed",
      reason:
        "Your HRV is on the lower side. Breathwork can activate your parasympathetic system and support recovery.",
    });
  } else if (
    hrvVal != null &&
    hrvVal > 60 &&
    sleepVal != null &&
    sleepVal >= 7
  ) {
    items.push({
      suggestion:
        "Maintain what you're doing — your recovery signals are strong",
      reason:
        "Good sleep and healthy HRV suggest your current routine works well.",
    });
  }

  // HR-based
  if (hrMed != null && hrMed > 80) {
    items.push({
      suggestion: "Check hydration and stress levels this week",
      reason: `A resting heart rate of ${Math.round(
        hrMed
      )} bpm is on the higher side. Hydration and stress management can help.`,
    });
  }

  // General fallback if no specific insights
  if (items.length === 0 && (overview?.uploads ?? 0) > 0) {
    items.push({
      suggestion: "Keep uploading data regularly for richer insights",
      reason:
        "More data points allow us to spot trends and give you better, more personalized suggestions.",
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
  sections: AnyRecord | null
): CompareImproveResult {
  const comparisons = buildComparisons(overview, trends);
  const interpretations = buildInterpretations(overview, trends, sections);
  const improvements = buildImprovements(overview, trends, sections);

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
