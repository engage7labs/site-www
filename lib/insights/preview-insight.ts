/**
 * Preview Insight — Sprint 17.6.2
 *
 * Generates a short, data-driven teaser from the user's own analysis
 * to demonstrate what Premium reveals. Deterministic, no mocks.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;

function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/**
 * Returns a short (1–2 line) data-driven preview insight string,
 * or null if no meaningful insight can be derived.
 */
export function getPreviewInsight(sections: Sections | null): string | null {
  if (!sections) return null;

  // 1) Recovery variability — HRV CV or HR regime shifts
  const hrvCv = safeNum(sections.volatility?.hrv_sdnn_mean?.cv);
  if (hrvCv != null && hrvCv > 25) {
    const hrShifts = sections.regime_shifts?.hr_mean;
    if (Array.isArray(hrShifts) && hrShifts.length > 0) {
      const count = hrShifts.length;
      return `Your recovery showed ${count} notable shift${
        count > 1 ? "s" : ""
      } — Premium shows what caused ${count > 1 ? "them" : "it"}.`;
    }
    return "Your recovery variability is higher than usual — Premium shows what's driving it.";
  }

  // 2) Sleep inconsistency — CV or weekend/weekday gap
  const sleepCv = safeNum(sections.volatility?.sleep_hours?.cv);
  if (sleepCv != null && sleepCv > 15) {
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
      const diff = Math.abs(weekendAvg - weekdayAvg);
      if (diff > 0.5) {
        return `Your sleep timing varies by ${diff.toFixed(
          1
        )} hours between weekdays and weekends — Premium helps you stabilize it.`;
      }
    }
    return "Your sleep patterns show notable variation — Premium helps you understand why.";
  }

  // 3) Activity imbalance — steps CV or weekday pattern
  const stepsCv = safeNum(sections.volatility?.total_steps?.cv);
  if (stepsCv != null && stepsCv > 40) {
    return "Your activity levels swing significantly day to day — Premium helps you balance your load.";
  }

  // 4) Sleep regime shift detected
  const sleepShifts = sections.regime_shifts?.sleep_hours;
  if (Array.isArray(sleepShifts) && sleepShifts.length > 0) {
    return "Your sleep changed noticeably at one point — Premium reveals what happened and what to do.";
  }

  // 5) Correlation-based insight
  const sleepHrCorr = safeNum(sections.correlations?.sleep_hours?.hr_mean);
  if (sleepHrCorr != null && Math.abs(sleepHrCorr) > 0.2) {
    return "Your sleep and heart rate are closely linked — Premium shows how to use that connection.";
  }

  // 6) Fallback — only if we have any baseline data at all
  const hasBaseline =
    safeNum(sections.baseline?.metrics?.sleep_hours?.median) != null ||
    safeNum(sections.baseline?.metrics?.hr_mean?.median) != null;
  if (hasBaseline) {
    return "Your data already shows patterns — Premium reveals what to do next.";
  }

  return null;
}
