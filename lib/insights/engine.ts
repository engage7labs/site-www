/**
 * Insight Engine — Sprint 25.0 / Hardened Sprint 25.1
 *
 * Deterministic rule-based engine generating:
 *   action   — strong directive, no hedging language
 *   insight  — felt experience or physiological consequence
 *   evidence — interpolated number + target
 *
 * Contract enforcement (Sprint 25.1):
 *   - Each insight is validated by validateInsight() from contract.ts
 *   - Invalid insights are dropped, not returned weakly
 *   - Output: max 3 insights, at least 1 critical if any exist
 *
 * Strict template rule:
 *   action  = fixed string, no synonym variation
 *   insight = fixed string, no synonym variation
 *   evidence = interpolated with actual measured value + target
 *
 * Language rules (ENFORCED):
 *   Banned in action: "improve", "optimize", "enhance", "try to", "consider"
 */

import type { AnalysisResult } from "@/lib/types/analysis";
import { validateInsight } from "./contract";

export type InsightPillar = "sleep" | "recovery" | "activity";
export type InsightSeverity = "critical" | "warning" | "info";

export interface Insight {
  id: string;
  pillar: InsightPillar;
  severity: InsightSeverity;
  /** 0–100, higher = more actionable/urgent. Used for ranking. */
  score: number;
  /** Strong directive — no hedging language. Fixed template. */
  action: string;
  /** Felt experience or physiological consequence. Fixed template. */
  insight: string;
  /** Interpolated with actual measured value and target. */
  evidence: string;
  /** Signal names that fired this rule. */
  metrics_used: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Sleep rules — strict templates
// ---------------------------------------------------------------------------

function evaluateSleepRules(sections: Sections): Insight[] {
  const insights: Insight[] = [];

  const ss = sections.sleep_stages;
  const deepPct = safeNum(ss?.percentages?.deep_pct);
  const remPct = safeNum(ss?.percentages?.rem_pct);
  const sleepMedian = safeNum(sections.baseline?.metrics?.sleep_hours?.median);
  const sleepCv = safeNum(sections.volatility?.sleep_hours?.cv);

  // Rule: deep sleep critically low (<10%)
  if (deepPct !== null && deepPct < 10) {
    insights.push({
      id: "sleep_deep_critical",
      pillar: "sleep",
      severity: "critical",
      score: Math.min(99, 90 + (10 - deepPct) * 0.5),
      action: "Reduce intensity today",
      insight: "Your body is not entering deep recovery",
      evidence: `Deep sleep: ${round1(deepPct)}% (target: >15%)`,
      metrics_used: ["deep_pct"],
    });
  // Rule: deep sleep below optimal (10–15%)
  } else if (deepPct !== null && deepPct < 15) {
    insights.push({
      id: "sleep_deep_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(89, 70 + (15 - deepPct) * 0.5),
      action: "Move workouts to mornings and keep a fixed wake time",
      insight: "Your deep sleep is below the repair threshold",
      evidence: `Deep sleep: ${round1(deepPct)}% (target: >15%)`,
      metrics_used: ["deep_pct"],
    });
  }

  // Rule: REM critically low (<15%)
  if (remPct !== null && remPct < 15) {
    insights.push({
      id: "sleep_rem_critical",
      pillar: "sleep",
      severity: "critical",
      score: Math.min(99, 85 + (15 - remPct) * 0.5),
      action: "Cut stimulants after 2pm and fix your sleep schedule",
      insight: "Your brain is not consolidating memory or processing emotion",
      evidence: `REM sleep: ${round1(remPct)}% (target: >20%)`,
      metrics_used: ["rem_pct"],
    });
  // Rule: REM below optimal (15–20%)
  } else if (remPct !== null && remPct < 20) {
    insights.push({
      id: "sleep_rem_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(84, 65 + (20 - remPct) * 0.5),
      action: "Reduce alcohol and set a consistent wind-down time",
      insight: "Your REM cycle is being cut short each night",
      evidence: `REM sleep: ${round1(remPct)}% (target: >20%)`,
      metrics_used: ["rem_pct"],
    });
  }

  // Rule: sleep duration critically short (<6h)
  if (sleepMedian !== null && sleepMedian < 6) {
    insights.push({
      id: "sleep_duration_critical",
      pillar: "sleep",
      severity: "critical",
      score: Math.min(99, 88 + (6 - sleepMedian) * 2),
      action: "Prioritize a full night of sleep tonight",
      insight: "Your sleep duration is too low to sustain recovery",
      evidence: `Median sleep: ${round1(sleepMedian)}h (target: >7h)`,
      metrics_used: ["sleep_hours_median"],
    });
  // Rule: sleep duration short (6–6.5h)
  } else if (sleepMedian !== null && sleepMedian < 6.5) {
    insights.push({
      id: "sleep_duration_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(87, 60 + (6.5 - sleepMedian) * 3),
      action: "Shift your bedtime 20 minutes earlier starting this week",
      insight: "Recovery is being cut before your body finishes the job",
      evidence: `Median sleep: ${round1(sleepMedian)}h (target: >7h)`,
      metrics_used: ["sleep_hours_median"],
    });
  }

  // Rule: high sleep variability (CV >30%)
  if (sleepCv !== null && sleepCv > 30) {
    insights.push({
      id: "sleep_variability_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(75, 40 + (sleepCv - 30) * 0.7),
      action: "Set a fixed wake time and hold it every day this week",
      insight: "Erratic sleep is preventing your body from building a rhythm",
      evidence: `Sleep variability: ${round1(sleepCv)}% CV (target: <20%)`,
      metrics_used: ["sleep_hours_cv"],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Recovery rules — strict templates
// ---------------------------------------------------------------------------

function evaluateRecoveryRules(sections: Sections): Insight[] {
  const insights: Insight[] = [];

  const rs = sections.recovery_signals;
  const recoveryScore = safeNum(rs?.recovery_composite_score);
  const spo2 = safeNum(rs?.metrics?.spo2_mean);
  const hrMedian = safeNum(sections.baseline?.metrics?.hr_mean?.median);
  const hrvMedian = safeNum(sections.baseline?.metrics?.hrv_sdnn_mean?.median);

  // Rule: recovery score critically low (<40)
  if (recoveryScore !== null && recoveryScore < 40) {
    insights.push({
      id: "recovery_score_critical",
      pillar: "recovery",
      severity: "critical",
      score: Math.min(99, 92 + (40 - recoveryScore) * 0.1),
      action: "Cut training load and add one extra hour of sleep today",
      insight: "Your body is past its recovery limit",
      evidence: `Recovery score: ${Math.round(recoveryScore)}/100 (target: >60)`,
      metrics_used: ["recovery_composite_score"],
    });
  // Rule: recovery score below optimal (40–60)
  } else if (recoveryScore !== null && recoveryScore < 60) {
    insights.push({
      id: "recovery_score_warning",
      pillar: "recovery",
      severity: "warning",
      score: Math.min(91, 68 + (60 - recoveryScore) * 0.3),
      action: "Lower your training intensity for the next 3 days",
      insight: "You are carrying accumulated fatigue your output does not show",
      evidence: `Recovery score: ${Math.round(recoveryScore)}/100 (target: >60)`,
      metrics_used: ["recovery_composite_score"],
    });
  }

  // Rule: SpO2 critically low (<93%)
  if (spo2 !== null && spo2 < 93) {
    insights.push({
      id: "recovery_spo2_critical",
      pillar: "recovery",
      severity: "critical",
      score: 95,
      action: "See a doctor this week",
      insight: "Your blood oxygen is at a level that requires medical evaluation",
      evidence: `SpO₂: ${round1(spo2)}% (healthy range: >95%)`,
      metrics_used: ["spo2_mean"],
    });
  // Rule: SpO2 below threshold (93–95%)
  } else if (spo2 !== null && spo2 < 95) {
    insights.push({
      id: "recovery_spo2_warning",
      pillar: "recovery",
      severity: "warning",
      score: Math.min(94, 72 + (95 - spo2) * 2),
      action: "Discuss your SpO₂ trend with a doctor",
      insight: "Your cells are running on less oxygen than they need",
      evidence: `SpO₂: ${round1(spo2)}% (target: >95%)`,
      metrics_used: ["spo2_mean"],
    });
  }

  // Rule: resting HR critically high (>90 bpm)
  if (hrMedian !== null && hrMedian > 90) {
    insights.push({
      id: "recovery_hr_critical",
      pillar: "recovery",
      severity: "critical",
      score: Math.min(94, 82 + (hrMedian - 90) * 0.3),
      action: "Stop high-intensity training until your heart rate drops",
      insight: "Your cardiovascular system is not recovering between sessions",
      evidence: `Resting HR: ${Math.round(hrMedian)} bpm (target: <80 bpm)`,
      metrics_used: ["hr_mean_median"],
    });
  // Rule: resting HR elevated (80–90 bpm)
  } else if (hrMedian !== null && hrMedian > 80) {
    insights.push({
      id: "recovery_hr_warning",
      pillar: "recovery",
      severity: "warning",
      score: Math.min(81, 55 + (hrMedian - 80) * 0.5),
      action: "Add a 20-minute walk daily for the next week",
      insight: "Your resting heart rate is elevated beyond the aerobic baseline",
      evidence: `Resting HR: ${Math.round(hrMedian)} bpm (target: <80 bpm)`,
      metrics_used: ["hr_mean_median"],
    });
  }

  // Rule: HRV critically low (<20 ms)
  if (hrvMedian !== null && hrvMedian > 0 && hrvMedian < 20) {
    insights.push({
      id: "recovery_hrv_critical",
      pillar: "recovery",
      severity: "critical",
      score: 86,
      action: "Stop all training and prioritize sleep and rest today",
      insight: "Your nervous system is in chronic overdrive",
      evidence: `HRV (SDNN): ${Math.round(hrvMedian)} ms (target: >40 ms)`,
      metrics_used: ["hrv_sdnn_mean_median"],
    });
  // Rule: HRV below optimal (20–40 ms)
  } else if (hrvMedian !== null && hrvMedian > 0 && hrvMedian < 40) {
    insights.push({
      id: "recovery_hrv_warning",
      pillar: "recovery",
      severity: "warning",
      score: 62,
      action: "Protect your next two nights of sleep",
      insight: "Your body cannot exit stress mode at this HRV level",
      evidence: `HRV (SDNN): ${Math.round(hrvMedian)} ms (target: >40 ms)`,
      metrics_used: ["hrv_sdnn_mean_median"],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Activity rules — strict templates
// ---------------------------------------------------------------------------

function evaluateActivityRules(sections: Sections): Insight[] {
  const insights: Insight[] = [];

  const as_ = sections.activity_signals;
  const totalEnergy = safeNum(as_?.total_energy_cal?.mean);
  const stepsMedian = safeNum(sections.baseline?.metrics?.total_steps?.median);
  const stepsCv = safeNum(sections.volatility?.total_steps?.cv);

  // Rule: daily energy critically low (<1,500 kcal)
  if (totalEnergy !== null && totalEnergy < 1500) {
    insights.push({
      id: "activity_energy_critical",
      pillar: "activity",
      severity: "critical",
      score: 80,
      action: "Walk for 30 minutes every day this week",
      insight: "Your body is not getting the physical stress it needs to stay functional",
      evidence: `Daily energy: ${Math.round(totalEnergy).toLocaleString()} kcal (target: >1,800 kcal)`,
      metrics_used: ["total_energy_cal_mean"],
    });
  // Rule: daily energy below optimal (1,500–1,800 kcal)
  } else if (totalEnergy !== null && totalEnergy < 1800) {
    insights.push({
      id: "activity_energy_warning",
      pillar: "activity",
      severity: "warning",
      score: 52,
      action: "Add a 20-minute walk to your daily routine",
      insight: "Your daily movement is below the baseline your metabolism requires",
      evidence: `Daily energy: ${Math.round(totalEnergy).toLocaleString()} kcal (target: >1,800 kcal)`,
      metrics_used: ["total_energy_cal_mean"],
    });
  }

  // Rule: steps critically low (<3,000)
  if (stepsMedian !== null && stepsMedian < 3000) {
    insights.push({
      id: "activity_steps_critical",
      pillar: "activity",
      severity: "critical",
      score: 78,
      action: "Walk for 15 minutes before 10am every day this week",
      insight: "Your body is sedentary at a level that affects every system",
      evidence: `Daily steps: ${Math.round(stepsMedian).toLocaleString()} (target: >7,000)`,
      metrics_used: ["total_steps_median"],
    });
  // Rule: steps below optimal (3,000–5,000)
  } else if (stepsMedian !== null && stepsMedian < 5000) {
    insights.push({
      id: "activity_steps_warning",
      pillar: "activity",
      severity: "warning",
      score: 52,
      action: "Park farther away and take every staircase you encounter",
      insight: "Your daily step count falls below the metabolic floor",
      evidence: `Daily steps: ${Math.round(stepsMedian).toLocaleString()} (target: >7,000)`,
      metrics_used: ["total_steps_median"],
    });
  }

  // Rule: step variability very high (CV >50%)
  if (stepsCv !== null && stepsCv > 50) {
    insights.push({
      id: "activity_variability_warning",
      pillar: "activity",
      severity: "warning",
      score: Math.min(65, 35 + (stepsCv - 50) * 0.3),
      action: "Commit to a 5,000-step floor every day regardless of schedule",
      insight: "Feast-or-famine movement prevents your body from adapting",
      evidence: `Step variability: ${round1(stepsCv)}% CV (target: <30%)`,
      metrics_used: ["total_steps_cv"],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate ranked, validated insights from analysis data.
 *
 * Pipeline:
 *   1. Evaluate rules across all pillars
 *   2. Validate each insight against the contract (invalid = dropped)
 *   3. Sort by score DESC
 *   4. Enforce: at least 1 critical if any exist
 *   5. Return max 3
 *
 * Fully deterministic — same input always produces the same output.
 */
export function generateInsights(data: AnalysisResult): Insight[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections = (data.sections as Record<string, any>) ?? null;
  if (!sections) return [];

  const validated = [
    ...evaluateSleepRules(sections),
    ...evaluateRecoveryRules(sections),
    ...evaluateActivityRules(sections),
  ]
    .filter(validateInsight)
    .sort((a, b) => b.score - a.score);

  if (validated.length === 0) return [];

  const result: Insight[] = [];

  // Guarantee: include at least 1 critical if any exist
  const firstCritical = validated.find((i) => i.severity === "critical");
  if (firstCritical) {
    result.push(firstCritical);
  }

  // Fill remaining slots (max 3 total) with highest-scoring remaining insights
  for (const ins of validated) {
    if (result.length >= 3) break;
    if (result.includes(ins)) continue;
    result.push(ins);
  }

  return result;
}
