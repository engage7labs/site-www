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
  locale: string = "en-IE",
): string {
  const label = report.report_label?.trim();
  if (label) {
    const claimedRange = /^claimed public analysis\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i.exec(label);
    if (claimedRange) {
      const [, start, end] = claimedRange;
      const joiner = locale === "pt-BR" ? "a" : "to";
      return `${copy.claimedPublicAnalysis} ${start} ${joiner} ${end}`;
    }

    const healthRange = /^health analysis\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i.exec(label);
    if (healthRange) {
      const [, start, end] = healthRange;
      const joiner = locale === "pt-BR" ? "a" : "to";
      return `${copy.healthAnalysis} ${start} ${joiner} ${end}`;
    }

    if (/^claimed public analysis$/i.test(label)) return copy.claimedPublicAnalysis;
    if (/^health analysis$/i.test(label)) return copy.healthAnalysis;
    return label;
  }

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