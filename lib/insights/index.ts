/**
 * Insights — barrel export
 */

export {
  extractActivityInsights,
  extractRecoveryInsights,
  extractSleepInsights,
  getTopInsights,
} from "./extract";
export type { InsightText } from "./extract";
export { getPreviewInsight } from "./preview-insight";
export { getSurprisingInsight } from "./surprising-insight";
