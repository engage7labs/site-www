/**
 * Insight Extraction — Sprint 11
 *
 * Derives deterministic, observational insight text from the existing
 * analysis payload sections. No ML, no fabricated inferences.
 * All text is calm, non-medical, non-alarmist.
 *
 * The "sections" data comes from GET /api/result/{job_id} and includes:
 *   baseline, weekly_patterns, monthly_patterns, yearly_summary,
 *   volatility, regime_shifts, correlations, executive_summary
 */

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
// Sleep insight
// ---------------------------------------------------------------------------

export interface InsightText {
  headline: string;
  body: string;
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
      });
    } else if (median > 8.5) {
      insights.push({
        headline: "You tend to sleep longer than most",
        body: `Your usual night is around ${round1(
          median
        )} hours—longer than average. This often means your body values deeper recovery time.`,
      });
    } else {
      insights.push({
        headline: "Your sleep looks fairly consistent",
        body: `You're getting around ${round1(
          median
        )} hours most nights, which is in a healthy range. Consistency like this is a strong sign of stable rest.`,
      });
    }
  }

  // Volatility
  const cv = safeNum(sections.volatility?.sleep_hours?.cv);
  if (cv != null && cv > 20) {
    insights.push({
      headline: "Your sleep duration varies quite a bit",
      body: "Some nights are longer, some shorter. This kind of variation can sometimes affect how rested you feel.",
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
      });
    }
  }

  return insights.slice(0, 3);
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
    });
  }

  return insights.slice(0, 3);
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
    });
  }

  // Steps volatility
  const stepsCv = safeNum(sections.volatility?.total_steps?.cv);
  if (stepsCv != null) {
    if (stepsCv < 30) {
      insights.push({
        headline: "Your movement is quite consistent",
        body: "Your daily step count doesn't swing wildly day to day. That kind of consistency is a good sign for long-term mobility.",
      });
    } else if (stepsCv > 50) {
      insights.push({
        headline: "Your activity levels vary a lot",
        body: "Some days you move a lot, some much less. High variation can sometimes reflect an unpredictable schedule or energy levels.",
      });
    }
  }

  // Weekly pattern — most vs least active day
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
        });
      }
    }
  }

  return insights.slice(0, 3);
}
