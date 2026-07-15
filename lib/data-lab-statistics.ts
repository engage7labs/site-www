export interface DataLabTrendPoint {
  date: string;
  value: number | null;
}

export type DataLabPeriod = "30d" | "90d" | "all";

export interface DescriptiveStatistics {
  observations: number;
  missingValues: number;
  invalidDates: number;
  firstDate: string | null;
  lastDate: string | null;
  spanDays: number;
  observedDayCoverage: number | null;
  mean: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
  standardDeviation: number | null;
  coefficientOfVariation: number | null;
  latest: number | null;
  changePercent: number | null;
  maximumGapDays: number | null;
}

export interface NamedTrendSeries {
  key: string;
  points: DataLabTrendPoint[];
}

export interface AlignedTrendSeries {
  dates: string[];
  values: Record<string, Array<number | null>>;
}

const DAY_MS = 86_400_000;

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (iso) {
    const parsed = new Date(
      Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])),
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function canonicalDate(value: string): string | null {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function quantile(sortedValues: number[], position: number): number | null {
  if (sortedValues.length === 0) return null;
  const index = (sortedValues.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return (
    sortedValues[lower] * (upper - index) +
    sortedValues[upper] * (index - lower)
  );
}

export function latestValidDate(
  series: DataLabTrendPoint[][],
): Date | null {
  const timestamps = series
    .flat()
    .map((point) => parseDate(point.date)?.getTime())
    .filter((value): value is number => value !== undefined);
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

export function filterTrendPoints(
  points: DataLabTrendPoint[],
  period: DataLabPeriod,
  latestDate: Date | null,
): DataLabTrendPoint[] {
  if (period === "all" || !latestDate) return points;
  const days = period === "30d" ? 30 : 90;
  const cutoff = latestDate.getTime() - (days - 1) * DAY_MS;
  return points.filter((point) => {
    const parsed = parseDate(point.date);
    return parsed !== null && parsed.getTime() >= cutoff;
  });
}

export function describeTrend(
  points: DataLabTrendPoint[],
): DescriptiveStatistics {
  const invalidDates = points.filter((point) => !parseDate(point.date)).length;
  const datedObservations = points
    .map((point) => ({ date: canonicalDate(point.date), value: point.value }))
    .filter(
      (point): point is { date: string; value: number } =>
        point.date !== null &&
        typeof point.value === "number" &&
        Number.isFinite(point.value),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const values = datedObservations.map((point) => point.value);
  const sortedValues = [...values].sort((a, b) => a - b);
  const mean =
    values.length > 0
      ? values.reduce((total, value) => total + value, 0) / values.length
      : null;
  const standardDeviation =
    mean !== null && values.length > 1
      ? Math.sqrt(
          values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
            (values.length - 1),
        )
      : null;

  const uniqueDates = [...new Set(datedObservations.map((point) => point.date))];
  const firstDate = uniqueDates[0] ?? null;
  const lastDate = uniqueDates.at(-1) ?? null;
  const spanDays =
    firstDate && lastDate
      ? Math.round(
          ((parseDate(lastDate)?.getTime() ?? 0) -
            (parseDate(firstDate)?.getTime() ?? 0)) /
            DAY_MS,
        ) + 1
      : 0;
  const gaps = uniqueDates.slice(1).map((date, index) => {
    const current = parseDate(date)?.getTime() ?? 0;
    const previous = parseDate(uniqueDates[index])?.getTime() ?? 0;
    return Math.max(0, Math.round((current - previous) / DAY_MS) - 1);
  });
  const latest = values.at(-1) ?? null;
  const previous = values.at(-2) ?? null;

  return {
    observations: values.length,
    missingValues: Math.max(0, points.length - values.length),
    invalidDates,
    firstDate,
    lastDate,
    spanDays,
    observedDayCoverage:
      spanDays > 0 ? Math.min(1, uniqueDates.length / spanDays) : null,
    mean,
    median: quantile(sortedValues, 0.5),
    minimum: sortedValues[0] ?? null,
    maximum: sortedValues.at(-1) ?? null,
    standardDeviation,
    coefficientOfVariation:
      standardDeviation !== null && mean !== null && mean !== 0
        ? Math.abs(standardDeviation / mean)
        : null,
    latest,
    changePercent:
      latest !== null && previous !== null && previous !== 0
        ? ((latest - previous) / Math.abs(previous)) * 100
        : null,
    maximumGapDays: gaps.length > 0 ? Math.max(...gaps) : null,
  };
}

export function alignTrendSeries(
  series: NamedTrendSeries[],
): AlignedTrendSeries {
  const dateSet = new Set<string>();
  const maps = new Map<string, Map<string, number | null>>();

  for (const item of series) {
    const valueByDate = new Map<string, number | null>();
    for (const point of item.points) {
      const date = canonicalDate(point.date);
      if (!date) continue;
      dateSet.add(date);
      valueByDate.set(
        date,
        typeof point.value === "number" && Number.isFinite(point.value)
          ? point.value
          : null,
      );
    }
    maps.set(item.key, valueByDate);
  }

  const dates = [...dateSet].sort();
  return {
    dates,
    values: Object.fromEntries(
      series.map((item) => [
        item.key,
        dates.map((date) => maps.get(item.key)?.get(date) ?? null),
      ]),
    ),
  };
}

export function buildDataLabCsv(series: NamedTrendSeries[]): string {
  const aligned = alignTrendSeries(series);
  const header = ["date", ...series.map((item) => item.key)];
  const rows = aligned.dates.map((date, index) =>
    [
      date,
      ...series.map((item) => aligned.values[item.key]?.[index] ?? ""),
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
