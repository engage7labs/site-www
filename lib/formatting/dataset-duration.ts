/**
 * Dataset Duration Formatter
 *
 * Deterministic helper that renders a human-readable dataset duration message.
 * Sprint 11 — never displays zero-value units or awkward phrasing.
 *
 * Rules:
 *   < 90 days  → "{n} days"
 *   90–729 d   → "{n} months"
 *   >= 730 d   → "{n} years"
 */

export interface DurationInfo {
  /** Human-readable value (e.g. 45, 5, 2) */
  value: number;
  /** Unit string: "days" | "months" | "years" */
  unit: "days" | "months" | "years";
  /** Pre-formatted label e.g. "45 days" */
  label: string;
}

/**
 * Compute a human-readable duration from a total number of days.
 * Falls back gracefully if days is null / undefined / <= 0.
 */
export function formatDatasetDuration(
  days: number | null | undefined
): DurationInfo | null {
  if (days == null || days <= 0) return null;

  if (days < 90) {
    return { value: days, unit: "days", label: `${days} days` };
  }

  if (days < 730) {
    const months = Math.round(days / 30);
    const safeMonths = Math.max(months, 1); // never return 0 months
    return {
      value: safeMonths,
      unit: "months",
      label: `${safeMonths} month${safeMonths !== 1 ? "s" : ""}`,
    };
  }

  const years = Math.round(days / 365);
  const safeYears = Math.max(years, 1); // never return 0 years
  return {
    value: safeYears,
    unit: "years",
    label: `${safeYears} year${safeYears !== 1 ? "s" : ""}`,
  };
}

/**
 * Compute duration from start / end date strings (YYYY-MM-DD).
 */
export function formatDatasetDurationFromDates(
  start: string | null | undefined,
  end: string | null | undefined
): DurationInfo | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const diffMs = e.getTime() - s.getTime();
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return formatDatasetDuration(diffDays);
}

/**
 * Build the full context message string.
 * e.g. "Based on 45 days of personal data."
 */
export function buildDurationMessage(
  days: number | null | undefined
): string | null {
  const info = formatDatasetDuration(days);
  if (!info) return null;
  return `Based on ${info.label} of personal data.`;
}
