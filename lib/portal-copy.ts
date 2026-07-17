export interface HiddenStepOutlierCopy {
  plural: string;
  singular?: string;
}

export interface ReportTableCopy {
  date: string;
  report: string;
  period: string;
  status: string;
  action: string;
  updated: string;
  view: string;
  healthAnalysis: string;
  claimedPublicAnalysis: string;
  timelineThrough: string;
}

export function formatHiddenStepOutliersMessage(
  count: number,
  copy: HiddenStepOutlierCopy,
): string {
  if (count === 1 && copy.singular) return copy.singular.replace("{count}", String(count));
  return copy.plural.replace("{count}", String(count));
}

export function getReportDisplayName(
  report: { report_label: string | null; upload_status?: string | null },
  copy: Pick<ReportTableCopy, "claimedPublicAnalysis" | "healthAnalysis">,
): string {
  if (report.report_label) return report.report_label;
  return report.upload_status === "imported"
    ? copy.claimedPublicAnalysis
    : copy.healthAnalysis;
}

export function formatTimelineThroughLabel(
  dateLabel: string,
  copy: Pick<ReportTableCopy, "timelineThrough">,
): string {
  return copy.timelineThrough.replace("{date}", dateLabel);
}