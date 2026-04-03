/**
 * Insight Scoring Engine — Sprint 17.0
 *
 * Deterministic scoring system that ranks insights by relevance and urgency.
 * All logic is based on the existing analysis data (no ML, no randomness).
 *
 * Score scale: 0–100
 * Priority mapping: 70+ = high, 40–69 = medium, <40 = low
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;

export type InsightPillar = "sleep" | "recovery" | "activity";
export type InsightPriority = "high" | "medium" | "low";

/**
 * Compute a deterministic score (0–100) for an insight.
 *
 * Scoring logic:
 * - Large deviations from baseline → higher urgency (more actionable)
 * - Negative recovery signals → higher priority (health concern)
 * - Consistency issues → medium priority (behavioral pattern)
 * - General patterns → lower priority (descriptive, not actionable)
 *
 * Headline keywords are used to infer intent and adjust score accordingly.
 */
export function scoreInsight(
  headline: string,
  sections: Sections | null
): number {
  if (!sections) return 30; // default low score

  const headlineLower = headline.toLowerCase();

  // Negative recovery signals → high urgency (70–85)
  if (
    headlineLower.includes("shifted") ||
    headlineLower.includes("variable") ||
    headlineLower.includes("varies")
  ) {
    // Regime shift or high volatility = actionable change
    return 75;
  }

  // Sleep deviation (too short or too long) → medium-high (60–70)
  if (
    headlineLower.includes("shorter") ||
    headlineLower.includes("longer than")
  ) {
    // Check actual baseline to refine
    const median = parseFloat(
      sections.baseline?.metrics?.sleep_hours?.median ?? "0"
    );
    if (median < 6.5 || median > 8.5) {
      return 68; // clear deviation = higher priority
    }
    return 55;
  }

  // Consistent patterns (positive) → lower priority (35–50)
  if (
    headlineLower.includes("consistent") ||
    headlineLower.includes("fairly")
  ) {
    return 40;
  }

  // Recovery indicators → medium (45–60)
  if (
    headlineLower.includes("heart rate") ||
    headlineLower.includes("variability") ||
    headlineLower.includes("connected")
  ) {
    const hrvMedian = parseFloat(
      sections.baseline?.metrics?.hrv_sdnn_mean?.median ?? "0"
    );
    if (hrvMedian > 0 && hrvMedian < 30) {
      // Low HRV = more important
      return 60;
    }
    return 50;
  }

  // Activity patterns → lower priority (30–45)
  if (headlineLower.includes("movement") || headlineLower.includes("steps")) {
    const stepsCv = parseFloat(sections.volatility?.total_steps?.cv ?? "0");
    if (stepsCv > 50) {
      // High variability = more actionable
      return 45;
    }
    return 35;
  }

  // Default: general insight
  return 45;
}

/**
 * Map headline text to which pillar this insight belongs to.
 */
export function getInsightPillar(headline: string): InsightPillar {
  const h = headline.toLowerCase();
  if (h.includes("sleep")) return "sleep";
  if (h.includes("heart") || h.includes("recovery") || h.includes("hrv"))
    return "recovery";
  if (h.includes("movement") || h.includes("steps") || h.includes("activity"))
    return "activity";
  // default based on context
  return "recovery";
}

/**
 * Determine priority band from score.
 */
export function scoreToPriority(score: number): InsightPriority {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Generate a deterministic action hint (1 sentence, human, non-clinical).
 */
export function getActionForInsight(
  headline: string,
  sections: Sections | null
): string | undefined {
  const h = headline.toLowerCase();

  // Sleep too short
  if (h.includes("shorter")) {
    return "Try going to bed 15–30 minutes earlier to support consistent recovery.";
  }

  // Sleep too long
  if (h.includes("longer than")) {
    return "Notice what might be leading to longer sleep—stress, less activity, or genuine need.";
  }

  // Sleep varies
  if (h.includes("varies quite")) {
    return "Aim for a consistent bedtime, even on weekends, to stabilize your sleep.";
  }

  // Sleep shifted
  if (h.includes("shifted in your sleep")) {
    return "Check what changed recently—routine, stress, or environment—and adjust if needed.";
  }

  // Sleep weekend difference
  if (h.includes("sleep more") || h.includes("sleep less")) {
    return "Keep your sleep time consistent across the week for steadier energy.";
  }

  // Heart rate variable
  if (h.includes("resting heart rate looks variable")) {
    return "Try reducing stress or increasing consistent movement to stabilize your heart rate.";
  }

  // Heart rate stable (positive)
  if (h.includes("resting heart rate looks stable")) {
    return "Keep up the routine that's keeping your recovery steady.";
  }

  // HRV pattern
  if (h.includes("heart rate variability")) {
    const hrvMedian = parseFloat(
      sections?.baseline?.metrics?.hrv_sdnn_mean?.median ?? "0"
    );
    if (hrvMedian > 0 && hrvMedian < 30) {
      return "Focus on sleep quality and stress management to support your nervous system.";
    }
    return "Continue monitoring your HRV as a window into how your body recovers.";
  }

  // Sleep-heart rate connection
  if (h.includes("sleep and heart rate")) {
    return "Prioritize good sleep—it directly affects your cardiovascular recovery.";
  }

  // Heart rate shift
  if (h.includes("heart rate shifted")) {
    return "Look for recent changes in stress, exercise, or sleep, and adjust your routine.";
  }

  // Activity baseline
  if (h.includes("movement baseline")) {
    const steps = parseFloat(
      sections?.baseline?.metrics?.total_steps?.median ?? "0"
    );
    if (steps < 5000) {
      return "Gradually increase daily movement—even 500 more steps a day makes a difference.";
    }
    return "Keep maintaining your daily movement—consistency matters more than intensity.";
  }

  // Movement consistent
  if (h.includes("movement is quite consistent")) {
    return "Your consistency is your strength—maintain this stable pattern.";
  }

  // Activity varies a lot
  if (h.includes("activity levels vary")) {
    return "Try to spread movement more evenly across the week for steadier energy.";
  }

  // Most active day
  if (h.includes("most active day")) {
    return "Balance your activity—spread movement more evenly through your week.";
  }

  // Fallback for unknown insights
  return undefined;
}

/**
 * Generate a lightweight benchmark message (personal baseline only).
 */
export function getBenchmarkForInsight(
  headline: string,
  sections: Sections | null
): string | undefined {
  if (!sections) return undefined;

  const h = headline.toLowerCase();

  // Sleep messages
  if (h.includes("sleep")) {
    const median = parseFloat(
      sections.baseline?.metrics?.sleep_hours?.median ?? "0"
    );
    const cv = parseFloat(sections.volatility?.sleep_hours?.cv ?? "0");

    if (cv > 20 && median > 0) {
      return `More variable than your usual rhythm (coefficient: ${cv.toFixed(
        0
      )}%).`;
    }
    if (median > 0) {
      return `Based on ${
        sections.baseline?.metrics?.sleep_hours?.count ?? "days"
      } days of your data.`;
    }
  }

  // Heart rate messages
  if (h.includes("heart rate")) {
    const hrMedian = parseFloat(
      sections.baseline?.metrics?.hr_mean?.median ?? "0"
    );
    if (hrMedian > 0) {
      return `Your recent baseline: ~${Math.round(hrMedian)} bpm.`;
    }
  }

  // HRV messages
  if (h.includes("heart rate variability") || h.includes("hrv")) {
    const hrvMedian = parseFloat(
      sections.baseline?.metrics?.hrv_sdnn_mean?.median ?? "0"
    );
    if (hrvMedian > 0) {
      return `Your typical HRV: ~${Math.round(hrvMedian)} ms.`;
    }
  }

  // Activity messages
  if (h.includes("movement") || h.includes("steps")) {
    const steps = parseFloat(
      sections.baseline?.metrics?.total_steps?.median ?? "0"
    );
    if (steps > 0) {
      return `Your baseline: ~${Math.round(
        steps
      ).toLocaleString()} steps per day.`;
    }
  }

  return undefined;
}
