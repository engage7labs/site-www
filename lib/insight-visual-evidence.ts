export const VISUAL_EVIDENCE_TYPES = [
  "metric_trend",
  "baseline_comparison",
  "period_comparison",
] as const;

export type VisualEvidenceType = (typeof VISUAL_EVIDENCE_TYPES)[number];

export interface VisualEvidencePoint {
  value: number;
  date?: string;
  period?: string;
  period_label?: string;
}

export interface VisualEvidenceSeries {
  metric: string;
  label: string;
  unit: string;
  points: VisualEvidencePoint[];
}

export interface VisualEvidenceReference {
  type: "baseline" | "previous_period";
  label: string;
  value: number;
  unit: string;
}

export interface InsightVisualEvidence {
  type: VisualEvidenceType;
  title: string;
  caption: string;
  series: VisualEvidenceSeries[];
  reference?: VisualEvidenceReference;
  sample_count: number;
}

const TYPE_SET = new Set<string>(VISUAL_EVIDENCE_TYPES);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseInsightVisualEvidence(value: unknown): InsightVisualEvidence | null {
  const source = record(value);
  if (!source || !nonEmptyString(source.type) || !TYPE_SET.has(source.type)) return null;
  if (!nonEmptyString(source.title) || !nonEmptyString(source.caption)) return null;
  if (!Number.isInteger(source.sample_count) || (source.sample_count as number) < 1) return null;
  if (!Array.isArray(source.series) || source.series.length < 1 || source.series.length > 2) return null;

  const series: VisualEvidenceSeries[] = [];
  let sharedUnit: string | null = null;
  for (const candidate of source.series) {
    const item = record(candidate);
    if (
      !item ||
      !nonEmptyString(item.metric) ||
      !nonEmptyString(item.label) ||
      !nonEmptyString(item.unit) ||
      !Array.isArray(item.points) ||
      item.points.length < 1 ||
      item.points.length > 12
    ) return null;
    if (sharedUnit !== null && sharedUnit !== item.unit) return null;
    sharedUnit = item.unit;
    const points: VisualEvidencePoint[] = [];
    let previousDate: string | null = null;
    for (const candidatePoint of item.points) {
      const point = record(candidatePoint);
      if (!point || !finiteNumber(point.value)) return null;
      const hasDate = nonEmptyString(point.date);
      const hasPeriod = nonEmptyString(point.period) && nonEmptyString(point.period_label);
      if (hasDate === hasPeriod) return null;
      if (hasDate) {
        if (!validDate(point.date as string) || (previousDate !== null && (point.date as string) <= previousDate)) return null;
        previousDate = point.date as string;
        points.push({ value: point.value, date: point.date as string });
      } else {
        points.push({
          value: point.value,
          period: point.period as string,
          period_label: point.period_label as string,
        });
      }
    }
    series.push({ metric: item.metric, label: item.label, unit: item.unit, points });
  }

  const type = source.type as VisualEvidenceType;
  if (type === "metric_trend" && (series.length !== 1 || series[0].points.length < 2 || series[0].points.some((point) => !point.date))) return null;
  if (type === "baseline_comparison" && (series.length !== 1 || series[0].points.length !== 1)) return null;
  if (type === "period_comparison" && series.some((item) => item.points.some((point) => !point.period_label))) return null;

  let reference: VisualEvidenceReference | undefined;
  if (source.reference !== undefined) {
    const candidate = record(source.reference);
    if (
      !candidate ||
      (candidate.type !== "baseline" && candidate.type !== "previous_period") ||
      !nonEmptyString(candidate.label) ||
      !finiteNumber(candidate.value) ||
      !nonEmptyString(candidate.unit) ||
      candidate.unit !== sharedUnit ||
      type !== "baseline_comparison"
    ) return null;
    reference = {
      type: candidate.type,
      label: candidate.label,
      value: candidate.value,
      unit: candidate.unit,
    };
  } else if (type === "baseline_comparison") {
    return null;
  }

  return {
    type,
    title: source.title,
    caption: source.caption,
    series,
    reference,
    sample_count: source.sample_count as number,
  };
}
