/**
 * Insight Extraction — Sprint 11 + Sprint 17.0
 *
 * Derives deterministic, observational insight text from the existing
 * analysis payload sections. No ML, no fabricated inferences.
 * All text is calm, non-medical, non-alarmist.
 *
 * Added in Sprint 17.0:
 * - Insight scoring (0–100 scale)
 * - Priority ranking (high/medium/low)
 * - Pillar classification (sleep/recovery/activity)
 * - Action hints (deterministic, human-friendly)
 * - Lightweight benchmarks (personal baseline only)
 *
 * The "sections" data comes from GET /api/result/{job_id} and includes:
 *   baseline, weekly_patterns, monthly_patterns, yearly_summary,
 *   volatility, regime_shifts, correlations, executive_summary
 */

import {
  getActionForInsight,
  getBenchmarkForInsight,
  getInsightPillar,
  scoreInsight,
  scoreToPriority,
  type InsightPillar,
  type InsightPriority,
} from "./scoring";

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
// Insight enrichment helper (Sprint 17.0)
// ---------------------------------------------------------------------------

/**
 * Enrich an insight with scoring, priority, action, and benchmark.
 * Converts a basic insight into a fully-ranked, actionable insight.
 */
function enrichInsight(
  insight: InsightText,
  sections: Sections | null
): InsightText {
  // Compute score based on headline
  const score = scoreInsight(insight.headline, sections);

  // Determine pillar
  const pillar = getInsightPillar(insight.headline);

  // Convert score to priority
  const priority = scoreToPriority(score);

  // Get action hint
  const action = getActionForInsight(insight.headline, sections);

  // Get benchmark message
  const benchmark = getBenchmarkForInsight(insight.headline, sections);

  return {
    ...insight,
    score,
    priority,
    pillar,
    action,
    benchmark,
  };
}

// ---------------------------------------------------------------------------
// Sleep insight
// ---------------------------------------------------------------------------

export interface InsightText {
  headline: string;
  body: string;
  /** Short explanation of what this means for the user */
  meaning?: string;
  /** Score from 0-100 (higher = more actionable) — Sprint 17.0 */
  score?: number;
  /** Priority bucket: high, medium, low — Sprint 17.0 */
  priority?: InsightPriority;
  /** Which pillar: sleep, recovery, activity — Sprint 17.0 */
  pillar?: InsightPillar;
  /** Action hint for the user (1 sentence, deterministic) — Sprint 17.0 */
  action?: string;
  /** Lightweight benchmark message (personal baseline only) — Sprint 17.0 */
  benchmark?: string;
}

export function extractSleepInsights(sections: Sections | null): InsightText[] {
  if (!sections) return [];
  const insights: InsightText[] = [];

  // Baseline median sleep
  const median = safeNum(sections.baseline?.metrics?.sleep_hours?.median);
  if (median != null) {
    if (median < 6.5) {
      insights.push({
        headline: "Your typical sleep is on the shorter side",
        body: `Your usual night is around ${round1(
          median
        )} hours. Shorter sleep can sometimes affect how you feel during the day.`,
        meaning:
          "This may indicate less recovery time than your body needs on a regular basis.",
      });
    } else if (median > 8.5) {
      insights.push({
        headline: "You tend to sleep longer than most",
        body: `Your usual night is around ${round1(
          median
        )} hours—longer than average. This often means your body values deeper recovery time.`,
        meaning:
          "Longer sleep can be a sign that your body prioritizes recovery.",
      });
    } else {
      insights.push({
        headline: "Your sleep looks fairly consistent",
        body: `You're getting around ${round1(
          median
        )} hours most nights, which is in a healthy range. Consistency like this is a strong sign of stable rest.`,
        meaning:
          "Consistent sleep in this range supports steady energy and recovery.",
      });
    }
  }

  // Volatility
  const cv = safeNum(sections.volatility?.sleep_hours?.cv);
  if (cv != null && cv > 20) {
    insights.push({
      headline: "Your sleep duration varies quite a bit",
      body: "Some nights are longer, some shorter. This kind of variation can sometimes affect how rested you feel.",
      meaning:
        "Variable sleep may reduce the predictability of your energy levels.",
    });
  }

  // Regime shift
  const shifts = sections.regime_shifts?.sleep_hours;
  if (Array.isArray(shifts) && shifts.length > 0) {
    const latest = shifts[shifts.length - 1];
    const dir = latest.direction === "increase" ? "increased" : "decreased";
    const mag = safeNum(latest.magnitude);
    if (mag != null) {
      insights.push({
        headline: `Something shifted in your sleep`,
        body: `Around ${latest.date}, your sleep ${dir} by about ${round1(
          mag
        )} hours. This is one of the clearest changes we spotted.`,
        meaning:
          "A notable shift like this often reflects a change in routine, stress, or environment.",
      });
    }
  }

  // Weekly pattern — weekend vs weekday
  const weekly = sections.weekly_patterns;
  if (Array.isArray(weekly) && weekly.length === 7) {
    const weekdayAvg =
      weekly
        .filter((d: { day_of_week: number }) => d.day_of_week <= 4)
        .reduce(
          (s: number, d: { sleep_hours: number }) => s + (d.sleep_hours ?? 0),
          0
        ) / 5;
    const weekendAvg =
      weekly
        .filter((d: { day_of_week: number }) => d.day_of_week >= 5)
        .reduce(
          (s: number, d: { sleep_hours: number }) => s + (d.sleep_hours ?? 0),
          0
        ) / 2;
    const diff = weekendAvg - weekdayAvg;
    if (Math.abs(diff) > 0.5) {
      const more = diff > 0 ? "more" : "less";
      insights.push({
        headline: `You sleep ${more} on weekends`,
        body: `There's a noticeable difference between your weekday and weekend sleep — about ${round1(
          Math.abs(diff)
        )} hours ${more} on Saturday and Sunday.`,
        meaning:
          "A consistent weekday–weekend difference can indicate your body is catching up on rest.",
      });
    }
  }

  return insights.slice(0, 3).map((ins) => enrichInsight(ins, sections));
}

// ---------------------------------------------------------------------------
// Recovery insight
// ---------------------------------------------------------------------------

export function extractRecoveryInsights(
  sections: Sections | null
): InsightText[] {
  if (!sections) return [];
  const insights: InsightText[] = [];

  // HR baseline
  const hrMedian = safeNum(sections.baseline?.metrics?.hr_mean?.median);
  if (hrMedian != null) {
    const stability =
      sections.executive_summary?.key_metrics?.["Resting Heart Rate"]
        ?.stability;
    const stab =
      stability === "very stable" || stability === "stable"
        ? "stable"
        : "variable";
    insights.push({
      headline: `Your resting heart rate looks ${stab}`,
      body: `Your typical resting heart rate is around ${Math.round(
        hrMedian
      )} bpm. A ${stab} heart rate is generally a good recovery sign.`,
      meaning:
        stab === "stable"
          ? "A steady heart rate suggests your body is maintaining a consistent recovery rhythm."
          : "More variation in heart rate can reflect changes in stress, fitness, or daily routine.",
    });
  }

  // HRV baseline
  const hrvMedian = safeNum(sections.baseline?.metrics?.hrv_sdnn_mean?.median);
  if (hrvMedian != null && hrvMedian > 0) {
    insights.push({
      headline: "Your heart rate variability shows a pattern",
      body: `Your HRV is typically around ${Math.round(
        hrvMedian
      )} ms. This reflects how your nervous system balances stress and recovery.`,
      meaning:
        "HRV is one of the strongest indicators of how well your body recovers from daily demands.",
    });
  }

  // Correlation between sleep and HR
  const sleepHrCorr = safeNum(sections.correlations?.sleep_hours?.hr_mean);
  if (sleepHrCorr != null && Math.abs(sleepHrCorr) > 0.15) {
    const relationship =
      sleepHrCorr < 0
        ? "when you sleep more, your resting heart rate tends to be lower"
        : "when you sleep more, your resting heart rate tends to be slightly higher";
    insights.push({
      headline: "Sleep and heart rate are connected",
      body: `Your data shows that ${relationship}. This is one pattern that helps explain your recovery rhythm.`,
      meaning:
        "This connection shows that your sleep quality directly influences your cardiovascular recovery.",
    });
  }

  // HR regime shift
  const hrShifts = sections.regime_shifts?.hr_mean;
  if (Array.isArray(hrShifts) && hrShifts.length > 0) {
    const latest = hrShifts[hrShifts.length - 1];
    const dir = latest.direction === "increase" ? "rose" : "dropped";
    insights.push({
      headline: "Your heart rate shifted at some point",
      body: `Around ${latest.date}, your resting heart rate ${dir} noticeably. This kind of change can reflect shifts in stress, fitness, or routine.`,
      meaning:
        "A clear shift in resting heart rate often marks a meaningful change in how your body is coping.",
    });
  }

  return insights.slice(0, 3).map((ins) => enrichInsight(ins, sections));
}

// ---------------------------------------------------------------------------
// Activity / mobility insight
// ---------------------------------------------------------------------------

export function extractActivityInsights(
  sections: Sections | null
): InsightText[] {
  if (!sections) return [];
  const insights: InsightText[] = [];

  // Steps baseline
  const stepsMedian = safeNum(sections.baseline?.metrics?.total_steps?.median);
  if (stepsMedian != null) {
    const formatted = Math.round(stepsMedian).toLocaleString();
    insights.push({
      headline: "Your daily movement baseline",
      body: `On a typical day, you're getting around ${formatted} steps. Consistency in movement is a strong sign of sustainable habits.`,
      meaning:
        "Regular daily movement supports both physical health and mental well-being over time.",
    });
  }

  // Steps volatility
  const stepsCv = safeNum(sections.volatility?.total_steps?.cv);
  if (stepsCv != null) {
    if (stepsCv < 30) {
      insights.push({
        headline: "Your movement is quite consistent",
        body: "Your daily step count doesn't swing wildly day to day. That kind of consistency is a good sign for long-term mobility.",
        meaning:
          "Consistent movement patterns are associated with stable energy and sustained physical health.",
      });
    } else if (stepsCv > 50) {
      insights.push({
        headline: "Your activity levels vary a lot",
        body: "Some days you move a lot, some much less. High variation can sometimes reflect an unpredictable schedule or energy levels.",
        meaning:
          "Large swings in activity may indicate uneven recovery or fluctuating demands on your body.",
      });
    }
  }

  // Monthly OR weekly — peak activity period (monthly preferred, Sprint 24.0.1)
  const monthly = sections.monthly_patterns;
  if (Array.isArray(monthly) && monthly.length > 0) {
    const withMonthlySteps = monthly.filter(
      (d: { total_steps?: number }) => d.total_steps != null && d.total_steps > 0
    );
    if (withMonthlySteps.length >= 3) {
      const sortedMonthly = [...withMonthlySteps].sort(
        (a: { total_steps: number }, b: { total_steps: number }) =>
          b.total_steps - a.total_steps
      );
      const peakMonth = sortedMonthly[0];
      if (peakMonth.month_name) {
        insights.push({
          headline: `Your activity peaks around ${peakMonth.month_name}`,
          body: `${peakMonth.month_name} tends to be your most active month. Your seasonal movement pattern shows a clear rhythm across the year.`,
          meaning:
            "Knowing your peak month helps you plan consistent movement throughout the year.",
        });
      }
    }
  } else {
    // Fallback: weekly pattern — most vs least active day
    const weekly = sections.weekly_patterns;
    if (Array.isArray(weekly) && weekly.length === 7) {
      const withSteps = weekly.filter(
        (d: { total_steps: number }) => d.total_steps != null && d.total_steps > 0
      );
      if (withSteps.length >= 5) {
        const sorted = [...withSteps].sort(
          (a: { total_steps: number }, b: { total_steps: number }) =>
            b.total_steps - a.total_steps
        );
        const most = sorted[0];
        const least = sorted[sorted.length - 1];
        if (most.day_name && least.day_name) {
          insights.push({
            headline: `${most.day_name} is your most active day`,
            body: `You tend to move most on ${most.day_name} and least on ${least.day_name}. Knowing your weekly rhythm can help you stay consistent.`,
            meaning:
              "Understanding your activity pattern helps you plan for consistent movement throughout the week.",
          });
        }
      }
    }
  }

  return insights.slice(0, 3).map((ins) => enrichInsight(ins, sections));
}

// ---------------------------------------------------------------------------
// Sprint 24.3: New signal extraction functions
// ---------------------------------------------------------------------------

/**
 * Extract insights from sleep stage data (Sprint 24.2 sleep_stages section).
 * Uses actual backend shape: { has_stage_data, percentages.{deep_pct,rem_pct}, stage_trend }
 */
export function extractSleepStageInsights(
  sections: Sections | null
): InsightText[] {
  if (!sections) return [];
  const ss = sections.sleep_stages;
  if (!ss || !ss.has_stage_data) return [];

  const insights: InsightText[] = [];
  const deepPct = safeNum(ss.percentages?.deep_pct);
  const remPct  = safeNum(ss.percentages?.rem_pct);
  const trend   = ss.stage_trend as string | null | undefined;

  if (deepPct !== null && deepPct < 15) {
    insights.push({
      headline: "Your deep sleep is lower than typical",
      body: "Deep sleep is when your body does most of its physical repair. Getting more of it can improve how rested you feel.",
      pillar: "sleep",
    });
  }

  if (remPct !== null && remPct < 20) {
    insights.push({
      headline: "Your REM sleep is on the lower side",
      body: "REM is when your brain consolidates memories and processes emotions. It typically makes up 20–25% of sleep.",
      pillar: "sleep",
    });
  }

  if (trend === "improving") {
    insights.push({
      headline: "Your sleep quality has been improving",
      body: "Your deep sleep trend over the past weeks has been moving in the right direction.",
      pillar: "sleep",
    });
  } else if (trend === "declining") {
    insights.push({
      headline: "Your sleep quality shows a declining trend",
      body: "Your sleep stage pattern has been shifting downward recently — worth paying attention to.",
      pillar: "sleep",
    });
  }

  return insights.slice(0, 3).map((ins) => enrichInsight(ins, sections));
}

/**
 * Extract insights from recovery signal data (Sprint 24.2 recovery_signals section).
 * Uses actual backend shape: { recovery_composite_score, metrics.{spo2_mean, respiratory_rate} }
 */
export function extractRecoverySignalInsights(
  sections: Sections | null
): InsightText[] {
  if (!sections) return [];
  const rs = sections.recovery_signals;
  if (!rs) return [];

  const insights: InsightText[] = [];
  const score   = safeNum(rs.recovery_composite_score);
  const spo2    = safeNum(rs.metrics?.spo2_mean);
  const respRate = safeNum(rs.metrics?.respiratory_rate);

  if (score !== null) {
    if (score >= 75) {
      insights.push({
        headline: `Your recovery score is strong (${Math.round(score)}/100)`,
        body: "Your HRV, resting heart rate, and blood oxygen signals suggest your body is handling stress well.",
        pillar: "recovery",
      });
    } else if (score >= 50) {
      insights.push({
        headline: `Your recovery score is moderate (${Math.round(score)}/100)`,
        body: "There's room to improve with consistent sleep and movement. Recovery scores tend to respond quickly to lifestyle changes.",
        pillar: "recovery",
      });
    } else {
      insights.push({
        headline: `Your recovery score is lower than ideal (${Math.round(score)}/100)`,
        body: "Your body may need more rest. A lower score often reflects accumulated stress or disrupted sleep.",
        pillar: "recovery",
      });
    }
  }

  if (spo2 !== null && spo2 < 95) {
    insights.push({
      headline: "Your blood oxygen levels are worth watching",
      body: `Your average SpO₂ is around ${round1(spo2)}% — slightly below the typical healthy range of 95–100%. Worth discussing with a doctor.`,
      pillar: "recovery",
    });
  }

  if (respRate !== null && respRate > 18) {
    insights.push({
      headline: "Your resting respiratory rate is slightly elevated",
      body: `Your average resting respiratory rate is around ${round1(respRate)} breaths/min. Elevated rates can sometimes reflect stress or poor sleep quality.`,
      pillar: "recovery",
    });
  }

  return insights.slice(0, 3).map((ins) => enrichInsight(ins, sections));
}

/**
 * Extract insights from activity signal data (Sprint 24.2 activity_signals section).
 * Uses actual backend shape: { total_energy_cal.{mean}, basal_energy_cal.{mean}, flights_climbed.{mean} }
 */
export function extractActivitySignalInsights(
  sections: Sections | null
): InsightText[] {
  if (!sections) return [];
  const as_ = sections.activity_signals;
  if (!as_) return [];

  const insights: InsightText[] = [];
  const totalEnergy  = safeNum(as_.total_energy_cal?.mean);
  const basalEnergy  = safeNum(as_.basal_energy_cal?.mean);
  const flightsMean  = safeNum(as_.flights_climbed?.mean);

  if (totalEnergy !== null) {
    insights.push({
      headline: "Your daily energy picture",
      body: `Your body burns around ${Math.round(totalEnergy).toLocaleString()} kcal per day on average — combining rest and movement.`,
      pillar: "activity",
    });
  } else if (basalEnergy !== null) {
    insights.push({
      headline: "Your resting energy output",
      body: `Your basal metabolism burns around ${Math.round(basalEnergy).toLocaleString()} kcal per day — the energy your body uses just to function.`,
      pillar: "activity",
    });
  }

  if (flightsMean !== null && flightsMean > 0) {
    insights.push({
      headline: "You're regularly climbing floors",
      body: `You average around ${Math.round(flightsMean)} flights of stairs per day — a simple but meaningful indicator of daily movement.`,
      pillar: "activity",
    });
  }

  return insights.slice(0, 3).map((ins) => enrichInsight(ins, sections));
}

// ---------------------------------------------------------------------------
// Aggregation Helper — "What Matters Today" (Sprint 17.0)
// ---------------------------------------------------------------------------

/**
 * Get the top 3 most actionable insights across all pillars.
 *
 * Rules:
 * - Max 3 insights
 * - At least 1 from sleep or recovery
 * - Sorted by score (highest first)
 *
 * Useful for decision-support dashboards and "what matters today" views.
 */
export function getTopInsights(allInsights: InsightText[]): InsightText[] {
  if (allInsights.length === 0) return [];

  // Sort by score (highest first)
  const sorted = [...allInsights].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );

  // Ensure at least one sleep or recovery insight
  const result: InsightText[] = [];
  let hasSleepOrRecovery = false;

  for (const ins of sorted) {
    if (result.length >= 3) break;

    // First priority: include sleep/recovery if present
    if (
      (ins.pillar === "sleep" || ins.pillar === "recovery") &&
      !hasSleepOrRecovery
    ) {
      result.push(ins);
      hasSleepOrRecovery = true;
    } else if (hasSleepOrRecovery) {
      // After we have a sleep/recovery insight, accept any high-value insight
      result.push(ins);
    }
  }

  // If we somehow missed the rule (unlikely given 3 buckets + 1 requirement),
  // ensure result is not empty
  if (result.length === 0 && sorted.length > 0) {
    result.push(sorted[0]);
  }

  return result;
}
