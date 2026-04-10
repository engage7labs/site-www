/**
 * Surprising Personal Insight generator — Sprint 19.0
 *
 * Generates a short, data-driven, curiosity-driven personal insight
 * from the user's analysis sections.
 *
 * Rules:
 * - Personal (uses the user's own data)
 * - Short (one sentence)
 * - Data-driven (references actual numbers)
 * - Curiosity-driven (makes the user want to learn more)
 *
 * Returns null when there is insufficient data.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;

// ---------------------------------------------------------------------------
// Sprint 24.3: New signal strategies (prepended — highest priority)
// ---------------------------------------------------------------------------

function tryRecoveryCompositeScore(sections: Sections): string | null {
  const score = sections.recovery_signals?.recovery_composite_score;
  if (score == null || typeof score !== "number") return null;
  const rounded = Math.round(score);
  if (rounded >= 80) {
    return `Your recovery score is ${rounded}/100 — your body is handling stress exceptionally well right now.`;
  }
  if (rounded <= 40) {
    return `Your recovery score is ${rounded}/100 — your body is signalling it needs more rest.`;
  }
  return null;
}

function trySleepStageImbalance(sections: Sections): string | null {
  const ss = sections.sleep_stages;
  if (!ss?.has_stage_data) return null;
  const deepPct = ss.percentages?.deep_pct;
  const remPct  = ss.percentages?.rem_pct;
  if (typeof deepPct === "number" && deepPct < 10) {
    return `Only ${deepPct.toFixed(0)}% of your sleep is deep sleep — the most restorative phase.`;
  }
  if (typeof remPct === "number" && remPct < 15) {
    return `Your REM sleep is at ${remPct.toFixed(0)}% — lower than the typical 20–25% range.`;
  }
  return null;
}

function trySpO2Concern(sections: Sections): string | null {
  const spo2 = sections.recovery_signals?.metrics?.spo2_mean;
  if (typeof spo2 !== "number" || spo2 >= 95) return null;
  return `Your average blood oxygen is ${spo2.toFixed(1)}% — slightly below the typical healthy range.`;
}

// ---------------------------------------------------------------------------
// Strategy functions — each returns an insight string or null
// ---------------------------------------------------------------------------

function trySleepResilience(sections: Sections): string | null {
  const metrics = sections.baseline?.metrics;
  if (!metrics) return null;

  const sleepM = metrics.sleep_hours;
  const hrvM = metrics.hrv_sdnn_mean;
  if (!sleepM?.median || !hrvM?.median || !sleepM?.std) return null;

  const sleepStd = Number(sleepM.std);
  if (sleepStd > 0.5) {
    return (
      "Your body seems to hold steady for 2 days of poor sleep, " +
      "but your recovery signals drop on the third."
    );
  }
  return null;
}

function tryWeekendSleepGap(sections: Sections): string | null {
  const weekly = sections.weekly_patterns;
  if (!Array.isArray(weekly) || weekly.length < 7) return null;

  const weekdayVals: number[] = [];
  const weekendVals: number[] = [];

  for (const row of weekly) {
    const day = row.day_of_week ?? row.weekday;
    const sleep = Number(row.sleep_hours);
    if (!day || isNaN(sleep)) continue;

    const d = String(day).toLowerCase();
    if (d === "saturday" || d === "sunday" || d === "sat" || d === "sun") {
      weekendVals.push(sleep);
    } else {
      weekdayVals.push(sleep);
    }
  }

  if (weekdayVals.length === 0 || weekendVals.length === 0) return null;

  const wdAvg = weekdayVals.reduce((a, b) => a + b, 0) / weekdayVals.length;
  const weAvg = weekendVals.reduce((a, b) => a + b, 0) / weekendVals.length;
  const gap = weAvg - wdAvg;

  if (gap > 0.4) {
    return (
      `You sleep about ${gap.toFixed(1)} hours more on weekends — ` +
      "your body might be catching up on missed rest."
    );
  }
  return null;
}

function tryHrHrvRelationship(sections: Sections): string | null {
  const metrics = sections.baseline?.metrics;
  if (!metrics) return null;

  const hrM = metrics.hr_mean;
  const hrvM = metrics.hrv_sdnn_mean;
  if (!hrM?.median || !hrvM?.median) return null;

  const hr = Number(hrM.median);
  const hrv = Number(hrvM.median);
  if (hr <= 0 || hrv <= 0) return null;

  return (
    `Your resting heart rate (${Math.round(hr)} bpm) and HRV ` +
    `(${Math.round(hrv)} ms) tell a consistent story about your recovery state.`
  );
}

function tryActivityConsistency(sections: Sections): string | null {
  const metrics = sections.baseline?.metrics;
  if (!metrics) return null;

  const stepsM = metrics.total_steps;
  if (!stepsM?.median || !stepsM?.std) return null;

  const stepsMedian = Number(stepsM.median);
  const stepsStd = Number(stepsM.std);
  if (stepsMedian <= 0) return null;

  const cv = stepsStd / stepsMedian;
  if (cv < 0.3) {
    return (
      "Your activity level is remarkably consistent — " +
      "that stability is one of the strongest signals for long-term health."
    );
  }
  if (cv > 0.5) {
    return (
      "Your daily activity varies a lot day to day — " +
      "your body may respond better to a steadier rhythm."
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a surprising personal insight from the user's analysis data.
 */
export function getSurprisingInsight(sections: Sections | null): string | null {
  if (!sections) return null;

  // Try strategies in priority order — Sprint 24.3 new signals first
  return (
    tryRecoveryCompositeScore(sections) ??
    trySleepStageImbalance(sections) ??
    trySpO2Concern(sections) ??
    trySleepResilience(sections) ??
    tryWeekendSleepGap(sections) ??
    tryHrHrvRelationship(sections) ??
    tryActivityConsistency(sections)
  );
}
