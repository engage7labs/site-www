"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { EChart } from "@/components/insights/echart";
import { RecoveryScoreChart } from "@/components/insights/recovery-score-chart";
import { HealthPeriodNavigator } from "@/components/portal/health-period-navigator";
import { useHealthTimeRange } from "@/hooks/use-health-time-range";
import {
  calendarDateWeekday,
  compareCalendarDates,
  formatCalendarDate,
  isCalendarDateInRange,
  normaliseHealthCalendarDate,
  parseCalendarDate,
  resolveHealthDateBounds,
  type HealthInclusiveRange,
  type HealthTimeRangeMode,
} from "@/lib/health-time-range";
import {
  buildSleepStageSeries,
  hasSleepStageData,
  SLEEP_STAGE_FIELD_GROUPS,
} from "@/lib/sleep-stage-data";
import type { PortalDataStatus } from "@/lib/portal-data-status";
import { parsePortalDataStatus } from "@/lib/portal-data-status";
import {
  buildStepsScaleModel,
  type StepsScaleModel,
  validDailySteps,
} from "@/lib/steps-chart-scale";
import { trackHealthDashboardViewed } from "@/lib/telemetry";
import type { EChartsOption } from "echarts";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Download,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  Info,
  Moon,
  Route,
  TrendingUp,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type HealthDomain = "sleep" | "recovery" | "activity";
type HealthDashboardDomain = HealthDomain | "all";
type Period = HealthTimeRangeMode;
type JsonScalar = string | number | boolean | null;
type UnknownRecord = Record<string, unknown>;
type HealthCopy =
  typeof import("@/lib/i18n/dictionaries/en-IE").enIE.portal.health;

interface HealthPoint {
  date: string;
  [key: string]: JsonScalar;
}

interface HealthDataResponse {
  analysis_count: number;
  feature_store: {
    date_start: string | null;
    date_end: string | null;
    row_count: number | null;
    updated_at: string | null;
  } | null;
  latest_sections: unknown;
  data_points: HealthPoint[];
  fields_available: string[];
  data_status: string;
  portal_data_status?: unknown;
}

interface MetricSeries {
  date: string;
  value: number | null;
}

interface ChartSeries {
  name: string;
  color: string;
  data: (number | null)[];
  type?: "line" | "bar";
  yAxisIndex?: number;
  stack?: string;
}

const COLORS = {
  sleep: "#3dbe73",
  deep: "#2563eb",
  rem: "#a855f7",
  core: "#14b8a6",
  awake: "#f59e0b",
  hrv: "#8b5cf6",
  hr: "#e5a336",
  recovery: "#6366f1",
  steps: "#5eead4",
  energy: "#f97316",
  distance: "#38bdf8",
  muted: "#94a3b8",
};

const DOMAIN_META = {
  all: {
    title: "All",
    subtitle: "Sleep, recovery, and activity evidence in one view",
    Icon: BarChart3,
    accent: COLORS.muted,
  },
  sleep: {
    title: "Sleep",
    subtitle: "Duration, stages, consistency, and sleep quality signals",
    Icon: Moon,
    accent: COLORS.sleep,
  },
  recovery: {
    title: "Recovery",
    subtitle: "HRV, heart-rate load, readiness, and baseline movement",
    Icon: HeartPulse,
    accent: COLORS.recovery,
  },
  activity: {
    title: "Activity",
    subtitle: "Steps, energy, distance, and consistency across your timeline",
    Icon: Activity,
    accent: COLORS.energy,
  },
} satisfies Record<
  HealthDashboardDomain,
  {
    title: string;
    subtitle: string;
    Icon: ElementType;
    accent: string;
  }
>;

const SLEEP_DURATION_KEYS = ["sleep_hours"];
const RECOVERY_HRV_KEYS = [
  "hrv_sdnn_mean",
  "hrv_sdnn_mean_median",
  "hrv_sdnn",
  "hrv",
];
const RECOVERY_HR_KEYS = [
  "hr_resting",
  "resting_hr",
  "resting_hr_mean",
  "hr_mean",
];
const RECOVERY_SCORE_KEYS = ["recovery_score", "readiness_score"];
const ACTIVITY_STEPS_KEYS = ["total_steps", "steps"];

const DOMAIN_KEYS: Record<HealthDomain, string[][]> = {
  sleep: [
    SLEEP_DURATION_KEYS,
    ...SLEEP_STAGE_FIELD_GROUPS,
    ["sleep_efficiency"],
    ["sleep_inbed_hours"],
  ],
  recovery: [
    RECOVERY_HRV_KEYS,
    ["hrv_sdnn_min"],
    RECOVERY_HR_KEYS,
    RECOVERY_SCORE_KEYS,
    ["spo2_mean"],
    ["respiratory_rate"],
  ],
  activity: [
    ACTIVITY_STEPS_KEYS,
    ["active_energy_cal", "total_active_energy"],
    ["distance_km", "total_distance"],
    ["exercise_minutes", "active_minutes", "activity_minutes"],
    ["stand_hours"],
    ["flights_climbed"],
  ],
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload(value: unknown): UnknownRecord | null {
  if (Array.isArray(value)) return unwrapPayload(value[0]);
  if (isRecord(value)) return value;
  return null;
}

function normaliseSections(sections: unknown): UnknownRecord | null {
  const root = unwrapPayload(sections);
  if (!root) return null;
  return {
    ...root,
    sleep_stages: unwrapPayload(root.sleep_stages) ?? root.sleep_stages,
    recovery_signals:
      unwrapPayload(root.recovery_signals) ?? root.recovery_signals,
    activity_signals:
      unwrapPayload(root.activity_signals) ?? root.activity_signals,
    body_context: unwrapPayload(root.body_context) ?? root.body_context,
    darth: unwrapPayload(root.darth) ?? root.darth,
  };
}

function getSection(
  sections: UnknownRecord | null,
  key: "sleep_stages" | "recovery_signals" | "activity_signals" | "darth",
): UnknownRecord | null {
  if (!sections) return null;
  return unwrapPayload(sections[key]);
}

function toNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function valueFor(point: HealthPoint, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(point[key]);
    if (value !== null) return value;
  }
  return null;
}

function positiveMetricValue(value: number): number | null {
  return value > 0 ? value : null;
}

function formatChartDate(value: string, locale: string): string {
  const parsed = parseCalendarDate(value);
  if (!parsed) return value;
  return formatCalendarDate(parsed, locale, {
    day: "numeric",
    month: "short",
  });
}

function formatDisplayDate(value: string, locale: string): string {
  const parsed = parseCalendarDate(value);
  if (!parsed) return value;
  return formatCalendarDate(parsed, locale);
}

function domainHasData(domain: HealthDomain, point: HealthPoint): boolean {
  return DOMAIN_KEYS[domain].some((keys) => valueFor(point, keys) !== null);
}

function sortedPoints(points: HealthPoint[]): HealthPoint[] {
  return [...points]
    .filter((point) => parseCalendarDate(point.date))
    .sort((a, b) => {
      const left = parseCalendarDate(a.date)!;
      const right = parseCalendarDate(b.date)!;
      return compareCalendarDates(left, right);
    });
}

function normaliseHealthPoints(points: HealthPoint[]): HealthPoint[] {
  return points.flatMap((point) => {
    const date = normaliseHealthCalendarDate(point.date);
    return date ? [{ ...point, date }] : [];
  });
}

function filterByRange(
  points: HealthPoint[],
  domain: HealthDomain,
  range: HealthInclusiveRange,
  period: Period,
  copy: HealthCopy,
  locale: string,
) {
  const all = sortedPoints(points);
  const domainPoints = all.filter((point) => domainHasData(domain, point));
  const domainFiltered = domainPoints.filter((point) =>
    isCalendarDateInRange(point.date, range),
  );
  const previousAvailableDay =
    period === "day"
      ? [...domainPoints]
          .reverse()
          .find((point) => {
            const parsed = parseCalendarDate(point.date);
            return parsed && compareCalendarDates(parsed, range.start) < 0;
          }) ?? null
      : null;
  const startLabel = formatCalendarDate(range.start, locale);
  const endLabel = formatCalendarDate(range.end, locale);

  return {
    points: domainFiltered,
    comparisonPoints: previousAvailableDay ? [previousAvailableDay] : [],
    hasAnyDomainData: domainPoints.length > 0,
    hasDomainDataInRange: domainFiltered.length > 0,
    rangeLabel: startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`,
    comparisonLabel:
      period === "today"
        ? copy.todayMayBePartial
        : period === "day"
          ? previousAvailableDay
            ? copy.comparedWithPreviousAvailableDay
            : copy.comparisonUnavailable
          : null,
  };
}

function metricSeries(
  points: HealthPoint[],
  keys: string[],
  transform?: (value: number, point: HealthPoint) => number | null,
): MetricSeries[] {
  return points.map((point) => {
    const value = valueFor(point, keys);
    return {
      date: point.date,
      value: value === null ? null : transform?.(value, point) ?? value,
    };
  });
}

function values(series: MetricSeries[]): number[] {
  return series
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
}

function hasAnyValue(point: HealthPoint, keyGroups: string[][]): boolean {
  return keyGroups.some((keys) => valueFor(point, keys) !== null);
}

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function standardDeviation(numbers: number[]): number | null {
  const mean = average(numbers);
  if (mean === null || numbers.length < 3) return null;
  const variance =
    numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    numbers.length;
  return Math.sqrt(variance);
}

function latestValue(series: MetricSeries[]): number | null {
  return [...series].reverse().find((point) => point.value !== null)?.value ?? null;
}

function latestPointWith(
  points: HealthPoint[],
  keys: string[],
): HealthPoint | null {
  return (
    [...points]
      .reverse()
      .find((point) => valueFor(point, keys) !== null) ?? null
  );
}

function formatValue(
  value: number | null,
  digits = 0,
  unavailableLabel = "Not available",
): string {
  if (value === null) return unavailableLabel;
  return value.toLocaleString("en-IE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatDelta(value: number | null, digits = 1): string {
  if (value === null) return "No baseline";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

function displayValueWithUnit(
  value: string,
  unit: string,
  muted = false,
): ReactNode {
  return (
    <>
      <span className={muted ? "text-base text-muted-foreground" : undefined}>
        {value}
      </span>
      {unit && (
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {unit}
        </span>
      )}
    </>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function estimatedReadinessScore({
  currentHrv,
  currentHr,
  allHrv,
  allHr,
  fallback,
}: Readonly<{
  currentHrv: number | null;
  currentHr: number | null;
  allHrv: number | null;
  allHr: number | null;
  fallback: number | null;
}>): number | null {
  const base = fallback ?? 70;
  let score = base;
  let signalCount = 0;

  if (currentHrv !== null && allHrv !== null && allHrv > 0) {
    score += ((currentHrv - allHrv) / allHrv) * 35;
    signalCount += 1;
  }

  if (currentHr !== null && allHr !== null && allHr > 0) {
    score += ((allHr - currentHr) / allHr) * 30;
    signalCount += 1;
  }

  if (signalCount === 0) return fallback;
  return clamp(score, 0, 100);
}

function statusFor(count: number, estimated = false) {
  if (estimated) return "estimated";
  if (count === 0) return "missing";
  if (count < 3) return "insufficient";
  return "valid";
}

type ComparisonState = {
  value: number | null;
  label: string;
  unit: string;
  status: "valid" | "insufficient" | "missing";
};

function baselineComparison({
  current,
  baseline,
  currentCount,
  baselineCount,
  period,
  unit,
  copy,
}: Readonly<{
  current: number | null;
  baseline: number | null;
  currentCount: number;
  baselineCount: number;
  period: Period;
  unit: string;
  copy: Pick<
    HealthCopy,
    "comparisonUnavailable" | "insufficientData" | "notEnoughBaselineData"
  >;
}>): ComparisonState {
  if (current === null || currentCount === 0) {
    return {
      value: null,
      label: copy.insufficientData,
      unit: "",
      status: "missing",
    };
  }

  if (period === "all") {
    return {
      value: null,
      label: copy.comparisonUnavailable,
      unit: "",
      status: "insufficient",
    };
  }

  if (baseline === null || baselineCount < 7) {
    return {
      value: null,
      label: copy.notEnoughBaselineData,
      unit: "",
      status: "insufficient",
    };
  }

  if (currentCount < 3) {
    return {
      value: null,
      label: copy.insufficientData,
      unit: "",
      status: "insufficient",
    };
  }

  return {
    value: current - baseline,
    label: formatDelta(current - baseline),
    unit,
    status: "valid",
  };
}

function previousAvailableComparison({
  current,
  previous,
  currentCount,
  previousCount,
  unit,
  copy,
}: Readonly<{
  current: number | null;
  previous: number | null;
  currentCount: number;
  previousCount: number;
  unit: string;
  copy: Pick<HealthCopy, "comparisonUnavailable" | "insufficientData">;
}>): ComparisonState {
  if (current === null || currentCount === 0) {
    return {
      value: null,
      label: copy.insufficientData,
      unit: "",
      status: "missing",
    };
  }

  if (previous === null || previousCount === 0) {
    return {
      value: null,
      label: copy.comparisonUnavailable,
      unit: "",
      status: "insufficient",
    };
  }

  return {
    value: current - previous,
    label: formatDelta(current - previous),
    unit,
    status: "valid",
  };
}

function buildAxisDates(points: HealthPoint[], locale: string): string[] {
  return points.map((point) => formatChartDate(point.date, locale));
}

function chartBase(): Pick<
  EChartsOption,
  "textStyle" | "tooltip" | "legend" | "grid" | "xAxis"
> {
  return {
    textStyle: { color: "#cbd5e1", fontFamily: "Inter, sans-serif" },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#F9FAFB",
      borderColor: "rgba(148, 163, 184, 0.22)",
      borderWidth: 1,
      textStyle: { color: "#111827", fontSize: 12 },
      extraCssText:
        "box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); border-radius: 12px;",
    },
    legend: {
      top: 0,
      textStyle: { color: "#cbd5e1", fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: 48, right: 42, top: 38, bottom: 26 },
    xAxis: {
      type: "category",
      axisLabel: { color: "#94a3b8", fontSize: 10 },
      axisLine: { lineStyle: { color: "transparent" } },
      axisTick: { show: false },
    },
  };
}

function tooltipValue(value: unknown, locale: string): string {
  return typeof value === "number"
    ? value.toLocaleString(locale === "pt-BR" ? "pt-BR" : "en-IE")
    : String(value ?? "");
}

function chartTooltipFormatter(locale: string) {
  return (params: unknown) => {
    const items = Array.isArray(params) ? params : [params];
    const first = items[0] as { axisValueLabel?: string; axisValue?: string } | undefined;
    const rows = items
      .map((item) => {
        const point = item as {
          marker?: string;
          seriesName?: string;
          value?: unknown;
        };
        if (point.value == null) return null;
        return `${point.marker ?? ""}${point.seriesName ?? ""}: ${tooltipValue(point.value, locale)}`;
      })
      .filter(Boolean);
    return [first?.axisValueLabel ?? first?.axisValue, ...rows]
      .filter(Boolean)
      .join("<br/>");
  };
}

function lineChartOption(
  points: HealthPoint[],
  series: ChartSeries[],
  locale: string,
  dualAxis = false,
  yMax?: number,
): EChartsOption {
  return {
    ...chartBase(),
    tooltip: {
      ...(chartBase().tooltip as UnknownRecord),
      formatter: chartTooltipFormatter(locale),
    },
    xAxis: {
      ...(chartBase().xAxis as UnknownRecord),
      data: buildAxisDates(points, locale),
    },
    yAxis: dualAxis
      ? [
          {
            type: "value",
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: {
              lineStyle: {
                color: "rgba(148, 163, 184, 0.18)",
                type: "dashed",
              },
            },
          },
          {
            type: "value",
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { show: false },
          },
        ]
      : {
          type: "value",
          max: yMax,
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: {
            lineStyle: {
              color: "rgba(148, 163, 184, 0.18)",
              type: "dashed",
            },
          },
        },
    series: series.map((item) => ({
      name: item.name,
      type: item.type ?? "line",
      data: item.data,
      smooth: item.type !== "bar",
      symbol: item.type === "bar" ? "none" : "circle",
      symbolSize: 5,
      yAxisIndex: item.yAxisIndex ?? 0,
      stack: item.stack,
      barMaxWidth: 28,
      lineStyle: { width: 2.5, color: item.color },
      itemStyle: {
        color: item.color,
        borderRadius: item.type === "bar" ? [5, 5, 0, 0] : 0,
      },
      areaStyle:
        item.type === "bar" || item.stack
          ? undefined
          : { color: `${item.color}18` },
    })),
  };
}

function stepsChartOption(
  scale: StepsScaleModel,
  seriesName: string,
  stepsUnit: string,
  locale: string,
  copy: Pick<HealthCopy, "stepsAverageLabel" | "stepsAboveVisibleScale">,
): EChartsOption {
  const option = lineChartOption(
    scale.points.map((point) => ({ date: point.date })),
    [
      {
        name: seriesName,
        color: COLORS.steps,
        data: scale.points.map((point) => point.renderedValue),
        type: "bar",
      },
    ],
    locale,
    false,
    scale.visualCeiling,
  );
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });
  const realValueFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 20,
  });
  const firstSeries = Array.isArray(option.series)
    ? (option.series[0] as UnknownRecord)
    : null;

  option.tooltip = {
    ...(option.tooltip as UnknownRecord),
    formatter: (params: unknown) => {
      const item = (Array.isArray(params) ? params[0] : params) as
        | {
            axisValue?: string;
            axisValueLabel?: string;
            marker?: string;
            seriesName?: string;
            data?: { realValue?: number; isClipped?: boolean };
          }
        | undefined;
      const datum = item?.data;
      if (!item || typeof datum?.realValue !== "number") return "";
      const rows = [
        item.axisValueLabel ?? item.axisValue,
        `${item.marker ?? ""}${item.seriesName ?? seriesName}: ${realValueFormatter.format(datum.realValue)} ${stepsUnit}`,
      ];
      if (datum.isClipped) {
        rows.push(
          copy.stepsAboveVisibleScale.replace(
            "{value}",
            numberFormatter.format(scale.visualCeiling),
          ),
        );
      }
      return rows.filter(Boolean).join("<br/>");
    },
  };

  if (firstSeries) {
    firstSeries.data = scale.points.map((point) =>
      point.realValue === null
        ? null
        : {
            value: point.renderedValue,
            realValue: point.realValue,
            isClipped: point.isClipped,
          },
    );
    firstSeries.markLine =
      scale.mean === null
        ? undefined
        : {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: COLORS.muted,
              type: "dashed",
              width: 1.5,
            },
            label: {
              show: true,
              position: "insideEndTop",
              color: COLORS.muted,
              fontSize: 11,
              formatter: copy.stepsAverageLabel
                .replace("{value}", numberFormatter.format(scale.mean))
                .replace("{unit}", stepsUnit),
            },
            data: [{ yAxis: scale.mean }],
          };
    firstSeries.markPoint =
      scale.clippedPointCount === 0
        ? undefined
        : {
            silent: true,
            symbol: "triangle",
            symbolSize: 10,
            symbolOffset: [0, -5],
            itemStyle: {
              color: COLORS.steps,
              borderColor: "#0f172a",
              borderWidth: 1,
            },
            label: { show: false },
            tooltip: { show: false },
            data: scale.points.flatMap((point, index) =>
              point.isClipped
                ? [{ coord: [index, scale.visualCeiling] }]
                : [],
            ),
          };
  }

  return option;
}

function sleepEfficiency(point: HealthPoint): number | null {
  const direct = valueFor(point, ["sleep_efficiency"]);
  if (direct !== null) return direct;
  const sleep = valueFor(point, ["sleep_hours"]);
  const inBed = valueFor(point, ["sleep_inbed_hours"]);
  if (sleep === null || inBed === null || inBed <= 0) return null;
  return Math.min(100, (sleep / inBed) * 100);
}

function weeklyAverage(points: HealthPoint[], keys: string[]): (number | null)[] {
  return WEEK_DAYS.map((_, index) => {
    const target = index === 6 ? 0 : index + 1;
    const dayValues = points
      .filter((point) => {
        const date = parseCalendarDate(point.date);
        return date ? calendarDateWeekday(date) === target : false;
      })
      .map((point) => valueFor(point, keys))
      .filter((value): value is number => value !== null);
    return dayValues.length ? Number(average(dayValues)!.toFixed(1)) : null;
  });
}

function bestAndLowest(points: HealthPoint[], keys: string[]) {
  const rows = points
    .map((point) => ({ point, value: valueFor(point, keys) }))
    .filter((row): row is { point: HealthPoint; value: number } => row.value !== null);
  if (rows.length === 0) return { best: null, lowest: null };
  return {
    best: rows.reduce((winner, row) => (row.value > winner.value ? row : winner)),
    lowest: rows.reduce((winner, row) =>
      row.value < winner.value ? row : winner,
    ),
  };
}

function TruthBadge({ status }: Readonly<{ status: string }>) {
  const { t, locale } = useLocale();
  const tone =
    status === "valid"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : status === "estimated"
        ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
        : status === "insufficient"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
          : "border-border bg-muted/40 text-muted-foreground";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {t.common.status[status as keyof typeof t.common.status] ?? status}
    </span>
  );
}

function SignalCard({
  label,
  value,
  unit,
  count,
  status,
  Icon,
}: Readonly<{
  label: string;
  value: string;
  unit: string;
  count: number;
  status: string;
  Icon: ElementType;
}>) {
  const { t, locale } = useLocale();
  return (
    <div className="portal-panel rounded-lg border border-border/70 bg-card/85 px-4 py-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <TruthBadge status={status} />
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-card-foreground">
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t.portal.health.trackedDays.replace("{count}", String(count))}
      </p>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  children: ReactNode;
}>) {
  return (
    <section className="portal-panel rounded-lg border border-border/70 bg-card/85 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function MetricState({
  title,
  body,
  Icon = Info,
}: Readonly<{
  title: string;
  body: string;
  Icon?: ElementType;
}>) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-muted/15 p-6 text-center">
      <Icon className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
      <p className="text-sm font-medium text-card-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function LoadingState() {
  const { t, locale } = useLocale();
  return (
    <div className="flex flex-col gap-6">
      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-6">
        <p className="text-sm text-muted-foreground">{t.portal.health.loading}</p>
      </div>
    </div>
  );
}

function DatasetEmptyState({
  status,
  portalStatus,
}: Readonly<{ status: string | undefined; portalStatus: PortalDataStatus | null }>) {
  const { t, locale } = useLocale();
  const message =
    !portalStatus?.hasAnalyses || portalStatus.analysisStatus === "no_analysis"
      ? t.portal.statusNotice.noAnalysis
      : portalStatus.analysisStatus === "analysis_processing"
        ? t.portal.statusNotice.processing
        : portalStatus.analysisStatus === "analysis_failed"
          ? t.portal.statusNotice.failed
          : portalStatus.featureTimelineStatus === "blob_unavailable" ||
              status === "blob_storage_unavailable"
      ? t.common.notAvailable
      : portalStatus.featureTimelineStatus === "blob_missing" ||
          status === "feature_store_blob_missing"
        ? t.common.unavailable
        : portalStatus.featureTimelineStatus === "parse_failed" ||
            status === "feature_store_parse_failed"
          ? t.common.unavailable
          : portalStatus.hasAnalyses && !portalStatus.hasFeatureTimeline
            ? t.portal.statusNotice.timelineMissing
            : t.common.notAvailable;

  return (
    <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-8 text-center">
      <Info className="mx-auto mb-3 h-9 w-9 text-muted-foreground/45" />
      <p className="text-sm font-medium text-card-foreground">
        {t.common.notAvailable}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function DomainEmptyState({
  domain,
  hasAnyDomainData,
  period,
}: Readonly<{
  domain: HealthDomain;
  hasAnyDomainData: boolean;
  period: Period;
}>) {
  const { t, locale } = useLocale();
  const meta = DOMAIN_META[domain];
  const domainCopy = t.portal.health.domains[domain];
  const body = hasAnyDomainData
    ? t.portal.health.outsidePeriod
        .replace("{domain}", domainCopy.title)
        .replace("{period}", t.portal.health.periods[period])
    : t.portal.health.domainMetricsMissing.replace("{domain}", domainCopy.title);

  return (
    <MetricState
      Icon={meta.Icon}
      title={t.portal.health.noDomainDataInView.replace(
        "{domain}",
        domainCopy.title.toLowerCase(),
      )}
      body={body}
    />
  );
}

function DomainSection({
  domain,
  children,
}: Readonly<{
  domain: HealthDomain;
  children: ReactNode;
}>) {
  const { t } = useLocale();
  const meta = DOMAIN_META[domain];
  const domainCopy = t.portal.health.domains[domain];
  const { Icon } = meta;

  return (
    <section className="health-export-section flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${meta.accent}18`,
            color: meta.accent,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-card-foreground">
            {domainCopy.title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {domainCopy.subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SleepDashboard({
  points,
  sections,
  rangeLabel,
  period,
}: Readonly<{
  points: HealthPoint[];
  sections: UnknownRecord | null;
  rangeLabel: string;
  period: Period;
}>) {
  const { t, locale } = useLocale();
  const isOneDayRange = period === "day" || points.length <= 1;
  const sleepPoints = points.filter((point) =>
    hasAnyValue(point, [SLEEP_DURATION_KEYS]),
  );
  const stagePoints = points.filter(hasSleepStageData);
  const sleep = metricSeries(sleepPoints, SLEEP_DURATION_KEYS);
  const sleepStageData = buildSleepStageSeries(stagePoints);
  const inBed = metricSeries(
    points.filter((point) => valueFor(point, ["sleep_inbed_hours"]) !== null),
    ["sleep_inbed_hours"],
  );
  const efficiency = sleepPoints.map((point) => ({
    date: point.date,
    value: sleepEfficiency(point),
  }));

  const sleepVals = values(sleep);
  const inBedVals = values(inBed);
  const efficiencyVals = values(efficiency);
  const latest = latestValue(sleep);
  const sleepStd = standardDeviation(sleepVals);
  const sleepSection = getSection(sections, "sleep_stages");
  const stageDays = toNumber(sleepSection?.n_days_with_stages);

  const stageSeries = sleepStageData
    .map((item) => ({
      ...item,
      name:
        item.key === "core"
          ? t.portal.health.stageCore
          : item.key === "deep"
            ? t.portal.health.stageDeep
            : item.key === "rem"
              ? t.portal.health.stageRem
              : t.portal.health.stageAwake,
      color: COLORS[item.key],
    }))
    .filter((item) => item.data.some((value) => value !== null));

  const weekly = weeklyAverage(sleepPoints, SLEEP_DURATION_KEYS);
  const currentAvg = average(sleepVals);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SignalCard
          Icon={Moon}
          label={t.portal.health.averageDuration}
          value={formatValue(currentAvg, 1, t.common.notAvailable)}
          unit="h"
          count={sleepVals.length}
          status={statusFor(sleepVals.length)}
        />
        <SignalCard
          Icon={CalendarDays}
          label={t.portal.health.latestNight}
          value={formatValue(latest, 1, t.common.notAvailable)}
          unit="h"
          count={latest === null ? 0 : 1}
          status={statusFor(latest === null ? 0 : 1)}
        />
        <SignalCard
          Icon={CalendarDays}
          label={t.portal.health.timeInBed}
          value={formatValue(average(inBedVals), 1, t.common.notAvailable)}
          unit={inBedVals.length ? "h" : ""}
          count={inBedVals.length}
          status={statusFor(inBedVals.length)}
        />
        <SignalCard
          Icon={BarChart3}
          label={t.portal.health.consistency}
          value={sleepStd === null ? t.portal.health.notEnough : `+/-${sleepStd.toFixed(2)}`}
          unit={sleepStd === null ? "" : "h"}
          count={sleepVals.length}
          status={statusFor(sleepVals.length, sleepStd !== null)}
        />
        <SignalCard
          Icon={Gauge}
          label={t.portal.health.efficiency}
          value={formatValue(average(efficiencyVals), 0, t.common.notAvailable)}
          unit={efficiencyVals.length ? "%" : ""}
          count={efficiencyVals.length}
          status={statusFor(efficiencyVals.length, efficiencyVals.length > 0)}
        />
      </div>

      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-card-foreground">
              {t.portal.health.transparentSleepMethod}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t.portal.health.appleHealthMayDiffer}
            </p>
          </div>
        </div>
      </div>

      <ChartPanel
        title={
          isOneDayRange
            ? t.portal.health.sleepOnSelectedDay
            : t.portal.health.sleepDuration
        }
        subtitle={`${
          isOneDayRange
            ? t.portal.health.selectedDay
            : t.portal.health.nightlySleepHours
        } - ${rangeLabel}`}
      >
        {sleepVals.length > 0 ? (
          <EChart
            height={310}
            option={lineChartOption(sleepPoints, [
              {
                name: t.portal.health.sleepH,
                color: COLORS.sleep,
                data: sleep.map((point) => point.value),
              },
            ], locale)}
          />
        ) : (
          <MetricState
            Icon={Moon}
            title={t.portal.health.sleepDurationMissing}
            body={t.portal.health.noSleepDurationValues}
          />
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title={t.portal.health.sleepStages}
          subtitle={
            isOneDayRange
              ? t.portal.health.oneDayRangeHint
              : t.portal.health.sleepStagesSubtitle
          }
        >
          {stageSeries.length > 0 ? (
            <EChart
              height={280}
              option={lineChartOption(
                stagePoints,
                stageSeries.map((item) => ({
                  ...item,
                  type: "bar",
                  stack: "stages",
                })),
                locale,
              )}
            />
          ) : (
            <MetricState
              Icon={Moon}
              title={t.portal.health.sleepStagesUnavailable}
              body={
                stageDays
                  ? t.portal.health.stageSummaryNoDailyRows.replace(
                      "{count}",
                      String(stageDays),
                    )
                  : t.portal.health.sleepStageRecordsMissing
              }
            />
          )}
        </ChartPanel>

        <ChartPanel
          title={t.portal.health.weeklyPattern}
          subtitle={t.portal.health.weeklyPatternSubtitle}
        >
          {sleepVals.length >= 7 ? (
            <EChart
              height={280}
              option={{
                ...lineChartOption(
                  WEEK_DAYS.map((day) => ({ date: day })),
                  [
                    {
                      name: t.portal.health.sleepH,
                      color: COLORS.sleep,
                      data: weekly,
                      type: "bar",
                    },
                  ],
                  locale,
                ),
                xAxis: {
                  ...(chartBase().xAxis as UnknownRecord),
                  data: WEEK_DAY_KEYS.map((day) => t.portal.health.weekDays[day]),
                },
              }}
            />
          ) : (
            <MetricState
              Icon={CalendarDays}
              title={t.portal.health.patternNeedsMoreDays}
              body={t.portal.health.weekdayPatternNeedsWeek}
            />
          )}
        </ChartPanel>
      </div>
    </div>
  );
}

function RecoveryDashboard({
  points,
  comparisonPoints,
  allPoints,
  sections,
  rangeLabel,
  period,
}: Readonly<{
  points: HealthPoint[];
  comparisonPoints: HealthPoint[];
  allPoints: HealthPoint[];
  sections: UnknownRecord | null;
  rangeLabel: string;
  period: Period;
}>) {
  const { t, locale } = useLocale();
  const hrv = metricSeries(points, RECOVERY_HRV_KEYS, positiveMetricValue);
  const hr = metricSeries(points, RECOVERY_HR_KEYS, positiveMetricValue);
  const scores = metricSeries(points, RECOVERY_SCORE_KEYS);
  const hrvVals = values(hrv);
  const hrVals = values(hr);
  const scoreVals = values(scores);
  const previousHrvVals = values(
    metricSeries(comparisonPoints, RECOVERY_HRV_KEYS, positiveMetricValue),
  );
  const previousHrVals = values(
    metricSeries(comparisonPoints, RECOVERY_HR_KEYS, positiveMetricValue),
  );
  const recoverySection = getSection(sections, "recovery_signals");
  const sectionScore = toNumber(recoverySection?.recovery_composite_score);
  const currentHrv = average(hrvVals);
  const currentHr = average(hrVals);
  const allHrvVals = values(
    metricSeries(allPoints, RECOVERY_HRV_KEYS, positiveMetricValue),
  );
  const allHrVals = values(
    metricSeries(allPoints, RECOVERY_HR_KEYS, positiveMetricValue),
  );
  const allHrv = average(allHrvVals);
  const allHr = average(allHrVals);
  const todayComparisonUnavailable: ComparisonState = {
    value: null,
    label: t.portal.health.comparisonUnavailable,
    unit: "",
    status: "insufficient",
  };
  const hrvComparison = period === "today"
    ? todayComparisonUnavailable
    : period === "day"
      ? previousAvailableComparison({
        current: currentHrv,
        previous: average(previousHrvVals),
        currentCount: hrvVals.length,
        previousCount: previousHrvVals.length,
        unit: "ms",
        copy: t.portal.health,
      })
    : baselineComparison({
        current: currentHrv,
        baseline: allHrv,
        currentCount: hrvVals.length,
        baselineCount: allHrvVals.length,
        period,
        unit: "ms",
        copy: t.portal.health,
      });
  const hrComparison = period === "today"
    ? todayComparisonUnavailable
    : period === "day"
      ? previousAvailableComparison({
        current: currentHr,
        previous: average(previousHrVals),
        currentCount: hrVals.length,
        previousCount: previousHrVals.length,
        unit: "bpm",
        copy: t.portal.health,
      })
    : baselineComparison({
        current: currentHr,
        baseline: allHr,
        currentCount: hrVals.length,
        baselineCount: allHrVals.length,
        period,
        unit: "bpm",
        copy: t.portal.health,
      });
  const readinessScore =
    average(scoreVals) ??
    estimatedReadinessScore({
      currentHrv,
      currentHr,
      allHrv,
      allHr,
      fallback: sectionScore,
    });
  const readinessCount =
    scoreVals.length ||
    (readinessScore !== null && (currentHrv !== null || currentHr !== null)
      ? hrvVals.length + hrVals.length
      : sectionScore !== null
        ? 1
        : 0);
  const isOneDayRange = period === "day" || points.length <= 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          Icon={TrendingUp}
          label={t.portal.health.averageHrv}
          value={formatValue(currentHrv, 1, t.common.notAvailable)}
          unit={currentHrv === null ? "" : "ms"}
          count={hrvVals.length}
          status={statusFor(hrvVals.length)}
        />
        <SignalCard
          Icon={HeartPulse}
          label={t.portal.health.averageHr}
          value={formatValue(currentHr, 0, t.common.notAvailable)}
          unit={currentHr === null ? "" : "bpm"}
          count={hrVals.length}
          status={statusFor(hrVals.length)}
        />
        <SignalCard
          Icon={Gauge}
          label={t.portal.health.readiness}
          value={formatValue(readinessScore, 0, t.common.notAvailable)}
          unit={readinessScore === null ? "" : "/ 100"}
          count={readinessCount}
          status={statusFor(readinessCount, scoreVals.length === 0 && readinessScore !== null)}
        />
        <SignalCard
          Icon={BarChart3}
          label={t.portal.health.hrvVsBaseline}
          value={hrvComparison.label}
          unit={hrvComparison.unit}
          count={hrvVals.length}
          status={hrvComparison.status}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
        <ChartPanel
          title={t.portal.health.hrvAndHeartRate}
          subtitle={`${
            isOneDayRange
              ? t.portal.health.recoveryMarkersSelectedDay
              : t.portal.health.recoveryMarkersOverTime
          } - ${rangeLabel}`}
        >
          {hrvVals.length > 0 || hrVals.length > 0 ? (
            <EChart
              height={330}
              option={lineChartOption(
                points,
                [
                  {
                    name: t.portal.health.hrvMs,
                    color: COLORS.hrv,
                    data: hrv.map((point) => point.value),
                  },
                  {
                    name: t.portal.health.hrBpm,
                    color: COLORS.hr,
                    data: hr.map((point) => point.value),
                    yAxisIndex: hrvVals.length > 0 ? 1 : 0,
                  },
                ].filter((item) => item.data.some((value) => value !== null)),
                locale,
                hrvVals.length > 0 && hrVals.length > 0,
              )}
            />
          ) : (
            <MetricState
              Icon={HeartPulse}
              title={t.portal.health.recoverySignalsMissing}
              body={t.portal.health.recoverySignalsMissingBody}
            />
          )}
        </ChartPanel>

        <ChartPanel
          title={t.portal.health.readiness}
          subtitle={t.portal.health.compositeScoreStored}
        >
          {readinessScore !== null ? (
            <RecoveryScoreChart
              score={readinessScore}
              height={250}
              label={t.portal.health.weightedCompositeSignals}
            />
          ) : (
            <MetricState
              Icon={Gauge}
              title={t.portal.health.scoreUnavailable}
              body={t.portal.health.scoreUnavailableBody}
            />
          )}
        </ChartPanel>
      </div>

      <ChartPanel
        title={t.portal.health.baselineComparison}
        subtitle={
          period === "today"
            ? t.portal.health.todayNoComparison
            : period === "day"
            ? t.portal.health.latestComparedWithPrevious
            : t.portal.health.selectedRangeVsTimeline
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background/35 p-4">
            <p className="text-xs font-semibold text-muted-foreground">HRV</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {displayValueWithUnit(
                hrvComparison.label,
                hrvComparison.unit,
                hrvComparison.value === null,
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hrvComparison.status === "valid"
                ? period === "today"
                  ? t.portal.health.todayNoFullDayComparison
                  : period === "day"
                  ? t.portal.health.latestVsPrevious
                  : t.portal.health.selectedVsTimeline
                : period === "today"
                  ? t.portal.health.todayNoFullDayComparison
                  : t.portal.health.comparisonNeedsData}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/35 p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              {t.portal.health.heartRate}
            </p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {displayValueWithUnit(
                hrComparison.label,
                hrComparison.unit,
                hrComparison.value === null,
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hrComparison.status === "valid"
                ? period === "today"
                  ? t.portal.health.todayNoFullDayComparison
                  : period === "day"
                  ? t.portal.health.latestVsPrevious
                  : t.portal.health.selectedVsTimeline
                : period === "today"
                  ? t.portal.health.todayNoFullDayComparison
                  : t.portal.health.comparisonNeedsData}
            </p>
          </div>
        </div>
      </ChartPanel>
    </div>
  );
}

function ActivityDashboard({
  points,
  rangeLabel,
  period,
}: Readonly<{
  points: HealthPoint[];
  rangeLabel: string;
  period: Period;
}>) {
  const { t, locale } = useLocale();
  const stepsScale = buildStepsScaleModel(
    points.map((point) => ({
      date: point.date,
      value: valueFor(point, ACTIVITY_STEPS_KEYS),
    })),
  );
  const energy = metricSeries(points, ["active_energy_cal", "total_active_energy"]);
  const distance = metricSeries(points, ["distance_km", "total_distance"]);
  const exercise = metricSeries(points, [
    "exercise_minutes",
    "active_minutes",
    "activity_minutes",
  ]);
  const stepsVals = stepsScale.points.flatMap((point) =>
    point.realValue === null ? [] : [point.realValue],
  );
  const energyVals = values(energy);
  const distanceVals = values(distance);
  const exerciseVals = values(exercise);
  const stepStd = standardDeviation(stepsVals);
  const stepPoints = points.map((point) => {
    const value = valueFor(point, ACTIVITY_STEPS_KEYS);
    return {
      ...point,
      total_steps:
        value === null ? point.total_steps : validDailySteps(value),
      steps: value === null ? point.steps : validDailySteps(value),
    };
  });
  const { best, lowest } = bestAndLowest(stepPoints, ACTIVITY_STEPS_KEYS);
  const isOneDayRange = period === "day" || points.length <= 1;
  const hasEnoughStepDaysForComparison = stepsVals.length >= 2;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          Icon={Footprints}
          label={t.portal.health.averageSteps}
          value={formatValue(average(stepsVals), 0, t.common.notAvailable)}
          unit={stepsVals.length ? t.portal.health.stepsUnit : ""}
          count={stepsVals.length}
          status={statusFor(stepsVals.length)}
        />
        <SignalCard
          Icon={Flame}
          label={t.portal.health.activeEnergy}
          value={formatValue(average(energyVals), 0, t.common.notAvailable)}
          unit={energyVals.length ? "Cal" : ""}
          count={energyVals.length}
          status={statusFor(energyVals.length)}
        />
        <SignalCard
          Icon={Route}
          label={t.portal.health.distance}
          value={formatValue(average(distanceVals), 2, t.common.notAvailable)}
          unit={distanceVals.length ? "km" : ""}
          count={distanceVals.length}
          status={statusFor(distanceVals.length)}
        />
        <SignalCard
          Icon={BarChart3}
          label={t.portal.health.consistency}
          value={
            stepStd === null
              ? t.portal.health.notEnough
              : `+/-${formatValue(stepStd, 0, t.common.notAvailable)}`
          }
          unit={stepStd === null ? "" : t.portal.health.stepsUnit}
          count={stepsVals.length}
          status={statusFor(stepsVals.length, stepStd !== null)}
        />
      </div>

      <ChartPanel
        title={
          isOneDayRange
            ? t.portal.health.stepsOnSelectedDay
            : t.portal.health.stepsTrend
        }
        subtitle={`${
          isOneDayRange
            ? t.portal.health.selectedDay
            : t.portal.health.dailySteps
        } - ${rangeLabel}`}
      >
        {stepsVals.length > 0 ? (
          <div className="flex flex-col gap-2">
            <EChart
              height={320}
              className="min-w-0 max-w-full overflow-hidden"
              ariaLabel={t.portal.health.stepsChartAccessibility
                .replace(
                  "{mean}",
                  new Intl.NumberFormat(locale, {
                    maximumFractionDigits: 0,
                  }).format(stepsScale.mean ?? 0),
                )
                .replace("{unit}", t.portal.health.stepsUnit)}
              option={stepsChartOption(
                stepsScale,
                t.portal.health.steps,
                t.portal.health.stepsUnit,
                locale,
                t.portal.health,
              )}
            />
            <ul
              className="sr-only"
              aria-label={t.portal.health.stepsAccessibleValues}
            >
              {stepsScale.points.flatMap((point) =>
                point.realValue === null
                  ? []
                  : [
                      <li key={point.date}>
                        {(point.isClipped
                          ? t.portal.health.stepsAccessiblePointClipped
                          : t.portal.health.stepsAccessiblePoint)
                          .replace(
                            "{date}",
                            formatDisplayDate(point.date, locale),
                          )
                          .replace(
                            "{value}",
                            new Intl.NumberFormat(locale, {
                              maximumFractionDigits: 20,
                            }).format(point.realValue),
                          )
                          .replace(
                            "{ceiling}",
                            new Intl.NumberFormat(locale, {
                              maximumFractionDigits: 0,
                            }).format(stepsScale.visualCeiling),
                          )}
                      </li>,
                    ],
              )}
            </ul>
            {stepsScale.clippedPointCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.portal.health.stepsClippingNote}
              </p>
            )}
          </div>
        ) : (
          <MetricState
            Icon={Footprints}
            title={t.portal.health.stepsMissing}
            body={t.portal.health.noStepCountValues}
          />
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title={
            isOneDayRange
              ? t.portal.health.energyDistanceSelectedDay
              : t.portal.health.energyAndDistance
          }
          subtitle={
            isOneDayRange
              ? t.portal.health.oneDayRangeHint
              : t.portal.health.energyDistanceSubtitle
          }
        >
          {energyVals.length > 0 || distanceVals.length > 0 ? (
            <EChart
              height={300}
              option={lineChartOption(
                points,
                ([
                  {
                    name: t.portal.health.energyCal,
                    color: COLORS.energy,
                    data: energy.map((point) => point.value),
                    type: "bar",
                  },
                  {
                    name: t.portal.health.distanceKm,
                    color: COLORS.distance,
                    data: distance.map((point) => point.value),
                    yAxisIndex: energyVals.length > 0 ? 1 : 0,
                  },
                ] satisfies ChartSeries[]).filter((item) =>
                  item.data.some((value) => value !== null),
                ),
                locale,
                energyVals.length > 0 && distanceVals.length > 0,
              )}
            />
          ) : (
            <MetricState
              Icon={Activity}
              title={t.portal.health.energyAndDistanceUnavailable}
              body={t.portal.health.energyAndDistanceUnavailableBody}
            />
          )}
        </ChartPanel>

        <ChartPanel
          title={
            hasEnoughStepDaysForComparison
              ? t.portal.health.bestVsLowest
              : t.portal.health.comparisonNeedsMoreDays
          }
          subtitle={
            hasEnoughStepDaysForComparison
              ? t.portal.health.stepRangeAnchors
              : t.portal.health.chooseLongerRangeForActivityComparison
          }
        >
          {hasEnoughStepDaysForComparison && best && lowest ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  {t.portal.health.bestDay}
                </p>
                <p className="mt-3 text-2xl font-semibold text-card-foreground">
                  {formatValue(best.value, 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDisplayDate(best.point.date, locale)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.portal.health.lowestDay}
                </p>
                <p className="mt-3 text-2xl font-semibold text-card-foreground">
                  {formatValue(lowest.value, 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDisplayDate(lowest.point.date, locale)}
                </p>
              </div>
              {exerciseVals.length > 0 && (
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  {t.portal.health.exerciseMinutesAverage.replace(
                    "{value}",
                    formatValue(average(exerciseVals), 0, t.common.notAvailable),
                  )}
                </p>
              )}
            </div>
          ) : (
            <MetricState
              Icon={Footprints}
              title={t.portal.health.comparisonNeedsMoreDays}
              body={t.portal.health.chooseLongerRangeForActivityComparison}
            />
          )}
        </ChartPanel>
      </div>
    </div>
  );
}

export function HealthDashboard({
  domain,
}: Readonly<{ domain: HealthDashboardDomain }>) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<HealthDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    trackHealthDashboardViewed(domain);
  }, [domain]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/proxy/users/portal-health-data");
        if (!res.ok) {
          throw new Error(`Portal health data failed: ${res.status}`);
        }
        const payload = (await res.json()) as HealthDataResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError(t.portal.health.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () => normaliseSections(data?.latest_sections),
    [data?.latest_sections],
  );
  const allPoints = useMemo(
    () => sortedPoints(normaliseHealthPoints(data?.data_points ?? [])),
    [data],
  );
  const availablePoints = useMemo(
    () =>
      allPoints.filter((point) =>
        (["sleep", "recovery", "activity"] as const).some((item) =>
          domainHasData(item, point),
        ),
      ),
    [allPoints],
  );
  const dateBounds = useMemo(
    () => resolveHealthDateBounds(availablePoints.map((point) => point.date)),
    [availablePoints],
  );
  const healthTimeRange = useHealthTimeRange(dateBounds);
  const period = healthTimeRange.selected?.mode ?? "day";
  const portalStatus = useMemo(
    () => parsePortalDataStatus(data?.portal_data_status),
    [data?.portal_data_status],
  );
  const activeDomains = useMemo(
    () =>
      domain === "all"
        ? (["sleep", "recovery", "activity"] as const)
        : ([domain] as const),
    [domain],
  );
  const domainFilters = useMemo(() => {
    const range = healthTimeRange.range;
    if (!range) return null;
    return Object.fromEntries(
        activeDomains.map((item) => [
          item,
          filterByRange(
            allPoints,
            item,
            range,
            period,
            t.portal.health,
            locale,
          ),
        ]),
      ) as Record<HealthDomain, ReturnType<typeof filterByRange>>;
  }, [
    activeDomains,
    allPoints,
    healthTimeRange.range,
    period,
    t.portal.health,
    locale,
  ]);
  const filtered = useMemo(
    () =>
      domainFilters &&
      (domain === "all" ? domainFilters.sleep : domainFilters[domain]),
    [domain, domainFilters],
  );
  const rangePoints = useMemo(() => {
    const range = healthTimeRange.range;
    return range
      ? availablePoints.filter((point) =>
          isCalendarDateInRange(point.date, range),
        )
      : [];
  }, [availablePoints, healthTimeRange.range]);

  const handleExportPdf = async () => {
    try {
      setExportError(null);
      setExporting(true);
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      window.print();
    } catch {
      setExportError(t.portal.health.pdfExportFailed);
    } finally {
      window.setTimeout(() => setExporting(false), 500);
    }
  };

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <MetricState
          Icon={Info}
          title={t.portal.health.unableToLoad}
          body={error}
        />
      </div>
    );
  }

  if (
    !data ||
    data.analysis_count === 0 ||
    availablePoints.length === 0 ||
    !dateBounds ||
    !healthTimeRange.selected ||
    !healthTimeRange.range ||
    !domainFilters ||
    !filtered
  ) {
    return (
      <DatasetEmptyState
        status={data?.data_status}
        portalStatus={portalStatus}
      />
    );
  }

  const meta = DOMAIN_META[domain];
  const domainCopy =
    domain === "all" ? t.portal.health.domains.all : t.portal.health.domains[domain];
  const { Icon } = meta;
  const storedDaysCount = rangePoints.length;
  const headerRangeLabel = filtered.rangeLabel;

  return (
    <div className="flex flex-col gap-6">
      <div data-health-export-content className="flex flex-col gap-6">
      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${meta.accent}18`,
                color: meta.accent,
              }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {domainCopy.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {domainCopy.subtitle}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {headerRangeLabel} ·{" "}
                {t.portal.health.storedDays.replace(
                  "{count}",
                  String(storedDaysCount),
                )}
              </p>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4">
            <HealthPeriodNavigator
              selected={healthTimeRange.selected}
              bounds={dateBounds}
              range={healthTimeRange.range}
              canMoveBackward={healthTimeRange.canMoveBackward}
              canMoveForward={healthTimeRange.canMoveForward}
              isLatest={healthTimeRange.isLatest}
              onModeChange={healthTimeRange.selectMode}
              onPrevious={healthTimeRange.moveBackward}
              onNext={healthTimeRange.moveForward}
              onJumpToLatest={healthTimeRange.jumpToLatest}
              onAnchorChange={healthTimeRange.selectAnchor}
            />
          </div>
        </div>
      </div>

      {domain === "all" ? (
        <div className="flex flex-col gap-8">
          {activeDomains.map((item) => {
            const itemFiltered = domainFilters[item];
            return (
              <DomainSection key={item} domain={item}>
                {!itemFiltered.hasDomainDataInRange ? (
                  <DomainEmptyState
                    domain={item}
                    hasAnyDomainData={itemFiltered.hasAnyDomainData}
                    period={period}
                  />
                ) : (
                  <>
                    {item === "sleep" && (
                      <SleepDashboard
                        points={itemFiltered.points}
                        sections={sections}
                        rangeLabel={itemFiltered.rangeLabel}
                        period={period}
                      />
                    )}
                    {item === "recovery" && (
                      <RecoveryDashboard
                        points={itemFiltered.points}
                        comparisonPoints={itemFiltered.comparisonPoints}
                        allPoints={allPoints}
                        sections={sections}
                        rangeLabel={itemFiltered.rangeLabel}
                        period={period}
                      />
                    )}
                    {item === "activity" && (
                      <ActivityDashboard
                        points={itemFiltered.points}
                        rangeLabel={itemFiltered.rangeLabel}
                        period={period}
                      />
                    )}
                  </>
                )}
              </DomainSection>
            );
          })}
        </div>
      ) : !filtered.hasDomainDataInRange ? (
        <DomainEmptyState
          domain={domain}
          hasAnyDomainData={filtered.hasAnyDomainData}
          period={period}
        />
      ) : (
        <>
          {domain === "sleep" && (
            <SleepDashboard
              points={filtered.points}
              sections={sections}
              rangeLabel={filtered.rangeLabel}
              period={period}
            />
          )}
          {domain === "recovery" && (
            <RecoveryDashboard
              points={filtered.points}
              comparisonPoints={filtered.comparisonPoints}
              allPoints={allPoints}
              sections={sections}
              rangeLabel={filtered.rangeLabel}
              period={period}
            />
          )}
          {domain === "activity" && (
            <ActivityDashboard
              points={filtered.points}
              rangeLabel={filtered.rangeLabel}
              period={period}
            />
          )}
        </>
      )}
      </div>

      {domain === "all" && (
        <div className="flex flex-col items-end gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            aria-label={
              exporting
                ? t.portal.health.preparingPdf
                : t.portal.health.exportToPdf
            }
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <Download className="h-4 w-4" />
            {exporting ? t.portal.health.preparingPdf : t.portal.health.exportToPdf}
          </button>
          {exportError && (
            <p className="text-xs text-destructive">{exportError}</p>
          )}
        </div>
      )}
    </div>
  );
}
