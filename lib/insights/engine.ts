/**
 * Insight Engine — Sprint 25.0
 *
 * Deterministic rule-based engine that generates strong, actionable insights
 * with emotional hooks and data-backed evidence. No AI, no randomness.
 *
 * Output model:
 *   id         — stable identifier for dedup/tracking
 *   pillar     — sleep | recovery | activity
 *   severity   — critical | warning | info
 *   score      — 0–100 (higher = more urgent/actionable)
 *   action     — strong directive (no "could", "might")
 *   insight    — emotional hook (why this matters now)
 *   evidence   — data-backed explanation with numbers
 *   metrics_used — list of signal names that fired this rule
 *
 * Language rules:
 *   Action  = strong directive ("Fix your sleep schedule")
 *   Insight = emotional hook  ("Your deep sleep has collapsed")
 *   Evidence = data grounded  ("Deep sleep: 7% (target: ≥15%)")
 */

import type { AnalysisResult } from "@/lib/types/analysis";

export type InsightPillar = "sleep" | "recovery" | "activity";
export type InsightSeverity = "critical" | "warning" | "info";

export interface Insight {
  id: string;
  pillar: InsightPillar;
  severity: InsightSeverity;
  /** 0–100, higher = more actionable/urgent. Used for ranking. */
  score: number;
  /** Strong directive — no hedging language */
  action: string;
  /** Emotional hook — why this matters now */
  insight: string;
  /** Data-backed explanation with specific numbers */
  evidence: string;
  /** Signal names that contributed to this insight */
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
// Sleep rules
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
      action: "Cut alcohol, late screens, and irregular bedtimes — all three suppress deep sleep.",
      insight: "Your deep sleep has nearly disappeared — your body is not repairing itself each night.",
      evidence: `Deep sleep: ${round1(deepPct)}% (target: ≥15%)`,
      metrics_used: ["deep_pct"],
    });
  // Rule: deep sleep below optimal (10–15%)
  } else if (deepPct !== null && deepPct < 15) {
    insights.push({
      id: "sleep_deep_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(89, 70 + (15 - deepPct) * 0.5),
      action: "Move exercise to mornings and maintain a fixed wake time to protect deep sleep.",
      insight: "Your deep sleep is below optimal — physical recovery is being cut short every night.",
      evidence: `Deep sleep: ${round1(deepPct)}% (target: ≥15%)`,
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
      action: "Eliminate stimulants after 2pm and fix your sleep schedule — REM loss is cumulative.",
      insight: "Your REM sleep is critically low — memory consolidation and emotional processing are impaired.",
      evidence: `REM sleep: ${round1(remPct)}% (target: ≥20%)`,
      metrics_used: ["rem_pct"],
    });
  // Rule: REM below optimal (15–20%)
  } else if (remPct !== null && remPct < 20) {
    insights.push({
      id: "sleep_rem_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(84, 65 + (20 - remPct) * 0.5),
      action: "Reduce alcohol and build a consistent wind-down routine to recover REM sleep.",
      insight: "Your REM sleep is lower than it should be — your brain is not getting full nightly recovery.",
      evidence: `REM sleep: ${round1(remPct)}% (target: ≥20%)`,
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
      action: "Move your bedtime 30 minutes earlier starting tonight — every hour of lost sleep compounds.",
      insight: "You are chronically sleep-deprived — your brain is operating at a cognitive deficit every day.",
      evidence: `Typical sleep: ${round1(sleepMedian)}h (target: ≥7h)`,
      metrics_used: ["sleep_hours_median"],
    });
  // Rule: sleep duration short (6–6.5h)
  } else if (sleepMedian !== null && sleepMedian < 6.5) {
    insights.push({
      id: "sleep_duration_warning",
      pillar: "sleep",
      severity: "warning",
      score: Math.min(87, 60 + (6.5 - sleepMedian) * 3),
      action: "Shift your bedtime 20 minutes earlier — small consistent gains compound into real recovery.",
      insight: "Your sleep is consistently short — recovery time is being cut before your body finishes the job.",
      evidence: `Typical sleep: ${round1(sleepMedian)}h (target: ≥7h)`,
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
      action: "Lock in a fixed wake time every day — timing consistency outperforms duration for recovery quality.",
      insight: "Your sleep is erratic — your body cannot build a stable rhythm with this much nightly variation.",
      evidence: `Sleep variability (CV): ${round1(sleepCv)}% (target: <20%)`,
      metrics_used: ["sleep_hours_cv"],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Recovery rules
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
      action: "Reduce training load, add sleep, and eliminate stressors today — your body is past its limit.",
      insight: "Your body is struggling to recover — stress signals are dominating your physiology right now.",
      evidence: `Recovery score: ${Math.round(recoveryScore)}/100 (target: ≥60)`,
      metrics_used: ["recovery_composite_score"],
    });
  // Rule: recovery score below optimal (40–60)
  } else if (recoveryScore !== null && recoveryScore < 60) {
    insights.push({
      id: "recovery_score_warning",
      pillar: "recovery",
      severity: "warning",
      score: Math.min(91, 68 + (60 - recoveryScore) * 0.3),
      action: "Ease training intensity this week — your body needs consistent recovery before you push harder.",
      insight: "Your recovery is incomplete — you are carrying more accumulated fatigue than your output shows.",
      evidence: `Recovery score: ${Math.round(recoveryScore)}/100 (target: ≥60)`,
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
      action: "See a doctor this week — blood oxygen at this level requires medical evaluation.",
      insight: "Your blood oxygen is dangerously low — this level demands immediate medical attention.",
      evidence: `Average SpO₂: ${round1(spo2)}% (healthy range: ≥95%)`,
      metrics_used: ["spo2_mean"],
    });
  // Rule: SpO2 below threshold (93–95%)
  } else if (spo2 !== null && spo2 < 95) {
    insights.push({
      id: "recovery_spo2_warning",
      pillar: "recovery",
      severity: "warning",
      score: Math.min(94, 72 + (95 - spo2) * 2),
      action: "Discuss your SpO₂ readings with a doctor — sustained low oxygen affects energy and recovery.",
      insight: "Your blood oxygen is below the healthy range — your cells are working harder than they should be.",
      evidence: `Average SpO₂: ${round1(spo2)}% (target: ≥95%)`,
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
      action: "Reduce training load immediately and prioritize sleep — your heart is under chronic strain.",
      insight: "Your resting heart rate is elevated — your cardiovascular system is not recovering between efforts.",
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
      action: "Add a daily walk or light session — consistent aerobic work lowers resting heart rate within weeks.",
      insight: "Your resting heart rate is higher than optimal — cardiovascular recovery has room to improve.",
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
      action: "Address recovery urgently — very low HRV means your nervous system is in chronic overdrive.",
      insight: "Your HRV is critically low — your nervous system cannot balance stress and recovery at this level.",
      evidence: `HRV (SDNN): ${Math.round(hrvMedian)} ms (typical healthy range: 40–100 ms)`,
      metrics_used: ["hrv_sdnn_mean_median"],
    });
  // Rule: HRV below optimal (20–40 ms)
  } else if (hrvMedian !== null && hrvMedian > 0 && hrvMedian < 40) {
    insights.push({
      id: "recovery_hrv_warning",
      pillar: "recovery",
      severity: "warning",
      score: 62,
      action: "Protect recovery windows — low HRV responds directly to better sleep and reduced stress load.",
      insight: "Your HRV is below the healthy range — your body is struggling to shift out of stress mode.",
      evidence: `HRV (SDNN): ${Math.round(hrvMedian)} ms (typical healthy range: 40–100 ms)`,
      metrics_used: ["hrv_sdnn_mean_median"],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Activity rules
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
      action: "Move for 30 minutes every day this week — your body needs consistent physical stress to function.",
      insight: "Your daily energy output is alarmingly low — your body is barely moving from day to day.",
      evidence: `Daily energy: ${Math.round(totalEnergy).toLocaleString()} kcal (target: ≥1,800 kcal)`,
      metrics_used: ["total_energy_cal_mean"],
    });
  // Rule: daily energy below optimal (1,500–1,800 kcal)
  } else if (totalEnergy !== null && totalEnergy < 1800) {
    insights.push({
      id: "activity_energy_warning",
      pillar: "activity",
      severity: "warning",
      score: 52,
      action: "Add a 20-minute walk to your daily routine — small consistent movement compounds into real health gains.",
      insight: "Your daily energy burn is below optimal — your movement habit needs rebuilding.",
      evidence: `Daily energy: ${Math.round(totalEnergy).toLocaleString()} kcal (target: ≥1,800 kcal)`,
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
      action: "Walk every day this week without exception — start with 15 minutes and build from there.",
      insight: "Your daily steps are critically low — sedentary behavior at this level affects every system in your body.",
      evidence: `Typical steps: ${Math.round(stepsMedian).toLocaleString()} (target: ≥7,000)`,
      metrics_used: ["total_steps_median"],
    });
  // Rule: steps below optimal (3,000–5,000)
  } else if (stepsMedian !== null && stepsMedian < 5000) {
    insights.push({
      id: "activity_steps_warning",
      pillar: "activity",
      severity: "warning",
      score: 52,
      action: "Add 2,000 steps to your daily target — park farther away, take stairs, walk during every call.",
      insight: "Your step count is well below what your body needs for baseline metabolic health.",
      evidence: `Typical steps: ${Math.round(stepsMedian).toLocaleString()} (target: ≥7,000)`,
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
      action: "Set a minimum daily step floor — commit to at least 5,000 steps every day regardless of schedule.",
      insight: "Your activity swings wildly from day to day — feast-or-famine movement does not build fitness.",
      evidence: `Step variability (CV): ${round1(stepsCv)}% (target: <30%)`,
      metrics_used: ["total_steps_cv"],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate ranked, actionable insights from analysis data.
 *
 * Pipeline: extract signals → evaluate rules → rank by score → top 5.
 * Fully deterministic — same input always produces the same output.
 */
export function generateInsights(data: AnalysisResult): Insight[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections = (data.sections as Record<string, any>) ?? null;
  if (!sections) return [];

  const all: Insight[] = [
    ...evaluateSleepRules(sections),
    ...evaluateRecoveryRules(sections),
    ...evaluateActivityRules(sections),
  ];

  // Sort descending by score, return top 5
  return all.sort((a, b) => b.score - a.score).slice(0, 5);
}
