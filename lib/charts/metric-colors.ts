/**
 * Shared chart color constants for the PDF-to-ECharts migration.
 *
 * Maps each physiological metric to a stable color token that
 * can be referenced by both the existing chart-configs builders
 * and new report page components as they are migrated.
 *
 * PDF source (matplotlib)       →  Web target (ECharts)
 * ──────────────────────────────────────────────────────────
 * sleep   #7C83FD (indigo)      →  EMERALD  #3dbe73
 * hr      #FF9800 (orange)      →  AMBER    #e5a336
 * hrv     #00BCD4 (cyan)        →  TEAL     #2ea8a0
 * steps   #4CAF50 (green)       →  EMERALD reused / secondary
 * pbsi    #9C27B0 (purple)      →  ROSE     #d946ef
 */

// ── Primary metric tokens ────────────────────────────────
export const METRIC_COLORS = {
  sleep: "#3dbe73", // Engage7 emerald
  hr: "#e5a336", // Engage7 amber
  hrv: "#2ea8a0", // Engage7 teal
  total_steps: "#5eead4", // lighter teal accent
  pbsi: "#d946ef", // rose / fuchsia
} as const;

export const METRIC_COLORS_LIGHT = {
  sleep: "rgba(61, 190, 115, 0.15)",
  hr: "rgba(229, 163, 54, 0.15)",
  hrv: "rgba(46, 168, 160, 0.15)",
  total_steps: "rgba(94, 234, 212, 0.15)",
  pbsi: "rgba(217, 70, 239, 0.15)",
} as const;

// ── Neutral tokens ───────────────────────────────────────
export const GRAPHITE = "#1c1e20";
export const MUTED = "#9aa0a6";
export const LIGHT_GRAY = "#e0e0e0";

export type MetricKey = keyof typeof METRIC_COLORS;
