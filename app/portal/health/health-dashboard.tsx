"use client";

import { EChart } from "@/components/insights/echart";
import { RecoveryScoreChart } from "@/components/insights/recovery-score-chart";
import { DarthStatePanel } from "@/components/portal/darth-state-panel";
import type { PortalDataStatus } from "@/lib/portal-data-status";
import { parsePortalDataStatus } from "@/lib/portal-data-status";
import type { EChartsOption } from "echarts";
import {
  Activity,
  BarChart3,
  CalendarDays,
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
type Period = "week" | "month" | "year" | "all";
type JsonScalar = string | number | boolean | null;
type UnknownRecord = Record<string, unknown>;

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

const PERIOD_LABELS: Record<Period, string> = {
  week: "Last Week",
  month: "Last Month",
  year: "Last Year",
  all: "All Time",
};

const PERIODS: Period[] = ["week", "month", "year", "all"];

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
  HealthDomain,
  {
    title: string;
    subtitle: string;
    Icon: ElementType;
    accent: string;
  }
>;

const DOMAIN_KEYS: Record<HealthDomain, string[][]> = {
  sleep: [
    ["sleep_hours"],
    ["sleep_hours_core"],
    ["sleep_hours_deep"],
    ["sleep_hours_rem"],
    ["sleep_efficiency"],
    ["sleep_inbed_hours"],
  ],
  recovery: [
    ["hrv_sdnn_mean"],
    ["hrv_sdnn_min"],
    ["hr_resting", "resting_hr", "resting_hr_mean", "hr_mean"],
    ["recovery_score"],
    ["spo2_mean"],
    ["respiratory_rate"],
  ],
  activity: [
    ["total_steps", "steps"],
    ["active_energy_cal", "total_active_energy"],
    ["distance_km", "total_distance"],
    ["exercise_minutes", "active_minutes", "activity_minutes"],
    ["stand_hours"],
    ["flights_climbed"],
  ],
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function parseDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateTime(point: HealthPoint): number {
  return parseDate(point.date)?.getTime() ?? 0;
}

function formatDate(value: string): string {
  const parsed = parseDate(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
  });
}

function formatRangeDate(date: Date): string {
  return date.toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function domainHasData(domain: HealthDomain, point: HealthPoint): boolean {
  return DOMAIN_KEYS[domain].some((keys) => valueFor(point, keys) !== null);
}

function sortedPoints(points: HealthPoint[]): HealthPoint[] {
  return [...points]
    .filter((point) => parseDate(point.date))
    .sort((a, b) => dateTime(a) - dateTime(b));
}

function getPeriodStart(anchor: Date, period: Period): Date {
  const start = new Date(anchor);
  if (period === "week") start.setDate(start.getDate() - 7);
  if (period === "month") start.setMonth(start.getMonth() - 1);
  if (period === "year") start.setFullYear(start.getFullYear() - 1);
  return start;
}

function filterByPeriod(
  points: HealthPoint[],
  domain: HealthDomain,
  period: Period,
) {
  const all = sortedPoints(points);
  const domainPoints = all.filter((point) => domainHasData(domain, point));
  const anchorPoint = domainPoints.at(-1) ?? all.at(-1);
  const anchor = anchorPoint ? parseDate(anchorPoint.date) : null;

  if (!anchor || period === "all") {
    return {
      points: all,
      hasAnyDomainData: domainPoints.length > 0,
      hasDomainDataInRange: domainPoints.length > 0,
      rangeLabel:
        all.length > 0
          ? `${formatDate(all[0].date)} - ${formatDate(all[all.length - 1].date)}`
          : "No range",
    };
  }

  const start = getPeriodStart(anchor, period);
  const filtered = all.filter((point) => {
    const parsed = parseDate(point.date);
    return parsed ? parsed >= start && parsed <= anchor : false;
  });
  const hasDomainDataInRange = filtered.some((point) =>
    domainHasData(domain, point),
  );

  return {
    points: filtered,
    hasAnyDomainData: domainPoints.length > 0,
    hasDomainDataInRange,
    rangeLabel: `${formatRangeDate(start)} - ${formatRangeDate(anchor)}`,
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

function formatValue(value: number | null, digits = 0): string {
  if (value === null) return "Not available";
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

function statusFor(count: number, estimated = false) {
  if (estimated) return "estimated";
  if (count === 0) return "missing";
  if (count < 3) return "insufficient";
  return "valid";
}

function buildAxisDates(points: HealthPoint[]): string[] {
  return points.map((point) => formatDate(point.date));
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

function lineChartOption(
  points: HealthPoint[],
  series: ChartSeries[],
  dualAxis = false,
): EChartsOption {
  return {
    ...chartBase(),
    xAxis: {
      ...(chartBase().xAxis as UnknownRecord),
      data: buildAxisDates(points),
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
      .filter((point) => parseDate(point.date)?.getDay() === target)
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

function PeriodSwitcher({
  period,
  onChange,
}: Readonly<{ period: Period; onChange: (period: Period) => void }>) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-0.5">
      {PERIODS.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            period === item
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {PERIOD_LABELS[item]}
        </button>
      ))}
    </div>
  );
}

function TruthBadge({ status }: Readonly<{ status: string }>) {
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
      {status}
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
        {count} tracked days
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

function InsightPanel({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/[0.04] px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent/80">
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-card-foreground/90">
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-6">
        <p className="text-sm text-muted-foreground">Loading health data...</p>
      </div>
    </div>
  );
}

function DatasetEmptyState({
  status,
  portalStatus,
}: Readonly<{ status: string | undefined; portalStatus: PortalDataStatus | null }>) {
  const message =
    !portalStatus?.hasAnalyses || portalStatus.analysisStatus === "no_analysis"
      ? "No analysis has been created yet. Update Data before using the Health dashboards."
      : portalStatus.analysisStatus === "analysis_processing"
        ? "Your latest analysis is still processing. The longitudinal health timeline will appear when it is ready."
        : portalStatus.analysisStatus === "analysis_failed"
          ? "The latest analysis did not complete, so the health timeline is not available from that run."
          : portalStatus.featureTimelineStatus === "blob_unavailable" ||
              status === "blob_storage_unavailable"
      ? "The stored health timeline is not available in this environment."
      : portalStatus.featureTimelineStatus === "blob_missing" ||
          status === "feature_store_blob_missing"
        ? "A health timeline record exists, but the stored daily data could not be read."
        : portalStatus.featureTimelineStatus === "parse_failed" ||
            status === "feature_store_parse_failed"
          ? "The stored health timeline could not be converted into dashboard data."
          : portalStatus.hasAnalyses && !portalStatus.hasFeatureTimeline
            ? "An analysis exists for this account, but the longitudinal UserFeatureStore timeline is not available yet."
            : "No stored health timeline is available yet for this account.";

  return (
    <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-8 text-center">
      <Info className="mx-auto mb-3 h-9 w-9 text-muted-foreground/45" />
      <p className="text-sm font-medium text-card-foreground">
        Health timeline unavailable
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
  const meta = DOMAIN_META[domain];
  const body = hasAnyDomainData
    ? `${meta.title} data exists outside ${PERIOD_LABELS[period]}. Select a wider range to view the stored records.`
    : `${meta.title} metrics were not present in the stored Apple Health data for this account.`;

  return (
    <MetricState
      Icon={meta.Icon}
      title={`No ${meta.title.toLowerCase()} data in this view`}
      body={body}
    />
  );
}

function SleepDashboard({
  points,
  allPoints,
  sections,
  rangeLabel,
}: Readonly<{
  points: HealthPoint[];
  allPoints: HealthPoint[];
  sections: UnknownRecord | null;
  rangeLabel: string;
}>) {
  const sleep = metricSeries(points, ["sleep_hours"]);
  const core = metricSeries(points, ["sleep_hours_core"]);
  const deep = metricSeries(points, ["sleep_hours_deep"]);
  const rem = metricSeries(points, ["sleep_hours_rem"]);
  const awake = points.map((point) => {
    const minutes = valueFor(point, ["sleep_awake_minutes"]);
    return { date: point.date, value: minutes === null ? null : minutes / 60 };
  });
  const efficiency = points.map((point) => ({
    date: point.date,
    value: sleepEfficiency(point),
  }));

  const sleepVals = values(sleep);
  const efficiencyVals = values(efficiency);
  const latest = latestValue(sleep);
  const sleepStd = standardDeviation(sleepVals);
  const sleepSection = getSection(sections, "sleep_stages");
  const stageDays = toNumber(sleepSection?.n_days_with_stages);
  const stageTrend =
    typeof sleepSection?.stage_trend === "string"
      ? sleepSection.stage_trend
      : null;

  const stageSeries = [
    { name: "Core", color: COLORS.core, data: core.map((point) => point.value) },
    { name: "Deep", color: COLORS.deep, data: deep.map((point) => point.value) },
    { name: "REM", color: COLORS.rem, data: rem.map((point) => point.value) },
    {
      name: "Awake",
      color: COLORS.awake,
      data: awake.map((point) => point.value),
    },
  ].filter((item) => item.data.some((value) => value !== null));

  const weekly = weeklyAverage(points, ["sleep_hours"]);
  const allSleepValues = values(metricSeries(allPoints, ["sleep_hours"]));
  const allTimeAvg = average(allSleepValues);
  const currentAvg = average(sleepVals);

  return (
    <div className="flex flex-col gap-5">
      <InsightPanel title="Latest sleep summary">
        {latest !== null ? (
          <p>
            Latest recorded sleep is {latest.toFixed(1)} hours.{" "}
            {currentAvg !== null && allTimeAvg !== null
              ? `This range averages ${currentAvg.toFixed(1)} hours against your all-time ${allTimeAvg.toFixed(1)} hour baseline.`
              : "The dashboard is using stored nightly sleep records only."}
            {stageTrend
              ? ` Deep sleep is ${stageTrend} across the latest stage-enabled sample.`
              : ""}
          </p>
        ) : (
          <p>Sleep duration is not available in the selected range.</p>
        )}
      </InsightPanel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          Icon={Moon}
          label="Average Duration"
          value={formatValue(currentAvg, 1)}
          unit="h"
          count={sleepVals.length}
          status={statusFor(sleepVals.length)}
        />
        <SignalCard
          Icon={CalendarDays}
          label="Latest Night"
          value={formatValue(latest, 1)}
          unit="h"
          count={latest === null ? 0 : 1}
          status={statusFor(latest === null ? 0 : 1)}
        />
        <SignalCard
          Icon={BarChart3}
          label="Consistency"
          value={sleepStd === null ? "Not enough" : `+/-${sleepStd.toFixed(2)}`}
          unit={sleepStd === null ? "" : "h"}
          count={sleepVals.length}
          status={statusFor(sleepVals.length, sleepStd !== null)}
        />
        <SignalCard
          Icon={Gauge}
          label="Efficiency"
          value={formatValue(average(efficiencyVals), 0)}
          unit={efficiencyVals.length ? "%" : ""}
          count={efficiencyVals.length}
          status={statusFor(efficiencyVals.length, efficiencyVals.length > 0)}
        />
      </div>

      <ChartPanel
        title="Sleep Duration"
        subtitle={`Nightly sleep hours - ${rangeLabel}`}
      >
        {sleepVals.length > 0 ? (
          <EChart
            height={310}
            option={lineChartOption(points, [
              {
                name: "Sleep (h)",
                color: COLORS.sleep,
                data: sleep.map((point) => point.value),
              },
            ])}
          />
        ) : (
          <MetricState
            Icon={Moon}
            title="Sleep duration missing"
            body="No sleep duration values are present in this selected range."
          />
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Sleep Stages"
          subtitle="Core, Deep, REM, and Awake where the export contains stages"
        >
          {stageSeries.length > 0 ? (
            <EChart
              height={280}
              option={lineChartOption(
                points,
                stageSeries.map((item) => ({
                  ...item,
                  type: "bar",
                  stack: "stages",
                })),
              )}
            />
          ) : (
            <MetricState
              Icon={Moon}
              title="Sleep stages unavailable"
              body={
                stageDays
                  ? `Stage summary exists for ${stageDays} days, but daily stage rows are not available to chart.`
                  : "Core, Deep, REM, and Awake records are not present in this stored export."
              }
            />
          )}
        </ChartPanel>

        <ChartPanel
          title="Weekly Pattern"
          subtitle="Average sleep duration by weekday in the selected range"
        >
          {sleepVals.length >= 7 ? (
            <EChart
              height={280}
              option={{
                ...lineChartOption(
                  WEEK_DAYS.map((day) => ({ date: day })),
                  [
                    {
                      name: "Sleep (h)",
                      color: COLORS.sleep,
                      data: weekly,
                      type: "bar",
                    },
                  ],
                ),
                xAxis: {
                  ...(chartBase().xAxis as UnknownRecord),
                  data: WEEK_DAYS,
                },
              }}
            />
          ) : (
            <MetricState
              Icon={CalendarDays}
              title="Pattern needs more days"
              body="At least a week of sleep records is needed for a weekday pattern."
            />
          )}
        </ChartPanel>
      </div>
    </div>
  );
}

function RecoveryDashboard({
  points,
  allPoints,
  sections,
  rangeLabel,
}: Readonly<{
  points: HealthPoint[];
  allPoints: HealthPoint[];
  sections: UnknownRecord | null;
  rangeLabel: string;
}>) {
  const hrv = metricSeries(points, ["hrv_sdnn_mean"]);
  const hr = metricSeries(points, [
    "hr_resting",
    "resting_hr",
    "resting_hr_mean",
    "hr_mean",
  ]);
  const scores = metricSeries(points, ["recovery_score"]);
  const hrvVals = values(hrv);
  const hrVals = values(hr);
  const scoreVals = values(scores);
  const recoverySection = getSection(sections, "recovery_signals");
  const sectionScore = toNumber(recoverySection?.recovery_composite_score);
  const latestScore = latestValue(scores) ?? sectionScore;
  const currentHrv = average(hrvVals);
  const currentHr = average(hrVals);
  const allHrv = average(values(metricSeries(allPoints, ["hrv_sdnn_mean"])));
  const allHr = average(
    values(
      metricSeries(allPoints, [
        "hr_resting",
        "resting_hr",
        "resting_hr_mean",
        "hr_mean",
      ]),
    ),
  );

  return (
    <div className="flex flex-col gap-5">
      <InsightPanel title="Recovery insight">
        <p>
          {latestScore !== null
            ? `Latest readiness score is ${Math.round(latestScore)} out of 100.`
            : "No readiness score is available, so the dashboard is using HRV and heart-rate signals directly."}
          {currentHrv !== null
            ? ` HRV averages ${currentHrv.toFixed(1)} ms in this range.`
            : ""}
          {typeof recoverySection?.score_note === "string"
            ? ` ${recoverySection.score_note}`
            : ""}
        </p>
      </InsightPanel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          Icon={TrendingUp}
          label="Average HRV"
          value={formatValue(currentHrv, 1)}
          unit={currentHrv === null ? "" : "ms"}
          count={hrvVals.length}
          status={statusFor(hrvVals.length)}
        />
        <SignalCard
          Icon={HeartPulse}
          label="Average HR"
          value={formatValue(currentHr, 0)}
          unit={currentHr === null ? "" : "bpm"}
          count={hrVals.length}
          status={statusFor(hrVals.length)}
        />
        <SignalCard
          Icon={Gauge}
          label="Readiness"
          value={formatValue(latestScore, 0)}
          unit={latestScore === null ? "" : "/ 100"}
          count={scoreVals.length || (sectionScore !== null ? 1 : 0)}
          status={statusFor(scoreVals.length || (sectionScore !== null ? 1 : 0))}
        />
        <SignalCard
          Icon={BarChart3}
          label="HRV vs Baseline"
          value={formatDelta(
            currentHrv !== null && allHrv !== null ? currentHrv - allHrv : null,
            1,
          )}
          unit={currentHrv !== null && allHrv !== null ? "ms" : ""}
          count={hrvVals.length}
          status={statusFor(hrvVals.length, currentHrv !== null && allHrv !== null)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
        <ChartPanel
          title="HRV and Heart Rate"
          subtitle={`Recovery markers over time - ${rangeLabel}`}
        >
          {hrvVals.length > 0 || hrVals.length > 0 ? (
            <EChart
              height={330}
              option={lineChartOption(
                points,
                [
                  {
                    name: "HRV (ms)",
                    color: COLORS.hrv,
                    data: hrv.map((point) => point.value),
                  },
                  {
                    name: "HR (bpm)",
                    color: COLORS.hr,
                    data: hr.map((point) => point.value),
                    yAxisIndex: hrvVals.length > 0 ? 1 : 0,
                  },
                ].filter((item) => item.data.some((value) => value !== null)),
                hrvVals.length > 0 && hrVals.length > 0,
              )}
            />
          ) : (
            <MetricState
              Icon={HeartPulse}
              title="Recovery signals missing"
              body="HRV and heart-rate metrics are not present in this selected range."
            />
          )}
        </ChartPanel>

        <ChartPanel
          title="Readiness"
          subtitle="Composite score when stored by the backend"
        >
          {latestScore !== null ? (
            <RecoveryScoreChart score={latestScore} height={250} label="" />
          ) : (
            <MetricState
              Icon={Gauge}
              title="Score unavailable"
              body="The stored analysis did not include a recovery or readiness score."
            />
          )}
        </ChartPanel>
      </div>

      <ChartPanel
        title="Baseline Comparison"
        subtitle="Selected range compared with your full stored timeline"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background/35 p-4">
            <p className="text-xs font-semibold text-muted-foreground">HRV</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {formatDelta(
                currentHrv !== null && allHrv !== null
                  ? currentHrv - allHrv
                  : null,
              )}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ms
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/35 p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Heart Rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {formatDelta(
                currentHr !== null && allHr !== null ? currentHr - allHr : null,
              )}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                bpm
              </span>
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
  sections,
}: Readonly<{
  points: HealthPoint[];
  rangeLabel: string;
  sections: UnknownRecord | null;
}>) {
  const steps = metricSeries(points, ["total_steps", "steps"]);
  const energy = metricSeries(points, ["active_energy_cal", "total_active_energy"]);
  const distance = metricSeries(points, ["distance_km", "total_distance"]);
  const exercise = metricSeries(points, [
    "exercise_minutes",
    "active_minutes",
    "activity_minutes",
  ]);
  const stepsVals = values(steps);
  const energyVals = values(energy);
  const distanceVals = values(distance);
  const exerciseVals = values(exercise);
  const stepStd = standardDeviation(stepsVals);
  const activitySection = getSection(sections, "activity_signals");
  const { best, lowest } = bestAndLowest(points, ["total_steps", "steps"]);

  return (
    <div className="flex flex-col gap-5">
      <InsightPanel title="Activity insight">
        <p>
          {stepsVals.length > 0
            ? `This range averages ${formatValue(average(stepsVals), 0)} steps per tracked day.`
            : "Step data is not available in this range."}
          {energyVals.length > 0
            ? ` Active energy averages ${formatValue(average(energyVals), 0)} calories.`
            : ""}
          {isRecord(activitySection?.active_energy_cal)
            ? " The latest backend activity summary includes active-energy coverage."
            : ""}
        </p>
      </InsightPanel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          Icon={Footprints}
          label="Average Steps"
          value={formatValue(average(stepsVals), 0)}
          unit={stepsVals.length ? "steps" : ""}
          count={stepsVals.length}
          status={statusFor(stepsVals.length)}
        />
        <SignalCard
          Icon={Flame}
          label="Active Energy"
          value={formatValue(average(energyVals), 0)}
          unit={energyVals.length ? "Cal" : ""}
          count={energyVals.length}
          status={statusFor(energyVals.length)}
        />
        <SignalCard
          Icon={Route}
          label="Distance"
          value={formatValue(average(distanceVals), 2)}
          unit={distanceVals.length ? "km" : ""}
          count={distanceVals.length}
          status={statusFor(distanceVals.length)}
        />
        <SignalCard
          Icon={BarChart3}
          label="Consistency"
          value={stepStd === null ? "Not enough" : `+/-${formatValue(stepStd, 0)}`}
          unit={stepStd === null ? "" : "steps"}
          count={stepsVals.length}
          status={statusFor(stepsVals.length, stepStd !== null)}
        />
      </div>

      <ChartPanel title="Steps Trend" subtitle={`Daily steps - ${rangeLabel}`}>
        {stepsVals.length > 0 ? (
          <EChart
            height={320}
            option={lineChartOption(points, [
              {
                name: "Steps",
                color: COLORS.steps,
                data: steps.map((point) => point.value),
                type: "bar",
              },
            ])}
          />
        ) : (
          <MetricState
            Icon={Footprints}
            title="Steps missing"
            body="No step-count values are present in the selected range."
          />
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Energy and Distance"
          subtitle="Active energy with distance overlay where available"
        >
          {energyVals.length > 0 || distanceVals.length > 0 ? (
            <EChart
              height={300}
              option={lineChartOption(
                points,
                ([
                  {
                    name: "Energy (Cal)",
                    color: COLORS.energy,
                    data: energy.map((point) => point.value),
                    type: "bar",
                  },
                  {
                    name: "Distance (km)",
                    color: COLORS.distance,
                    data: distance.map((point) => point.value),
                    yAxisIndex: energyVals.length > 0 ? 1 : 0,
                  },
                ] satisfies ChartSeries[]).filter((item) =>
                  item.data.some((value) => value !== null),
                ),
                energyVals.length > 0 && distanceVals.length > 0,
              )}
            />
          ) : (
            <MetricState
              Icon={Activity}
              title="Energy and distance unavailable"
              body="The stored export does not contain active energy or distance values for this range."
            />
          )}
        </ChartPanel>

        <ChartPanel title="Best vs Lowest" subtitle="Step-count range anchors">
          {best && lowest ? (
            <div className="grid h-[300px] content-center gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Best day
                </p>
                <p className="mt-3 text-2xl font-semibold text-card-foreground">
                  {formatValue(best.value, 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(best.point.date)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lowest day
                </p>
                <p className="mt-3 text-2xl font-semibold text-card-foreground">
                  {formatValue(lowest.value, 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(lowest.point.date)}
                </p>
              </div>
              {exerciseVals.length > 0 && (
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  Exercise minutes average{" "}
                  {formatValue(average(exerciseVals), 0)} minutes in this range.
                </p>
              )}
            </div>
          ) : (
            <MetricState
              Icon={Footprints}
              title="Step comparison unavailable"
              body="At least one day with step data is needed for best and lowest periods."
            />
          )}
        </ChartPanel>
      </div>
    </div>
  );
}

export function HealthDashboard({
  domain,
}: Readonly<{ domain: HealthDomain }>) {
  const [data, setData] = useState<HealthDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");

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
        if (!cancelled) setError("Health data could not be loaded.");
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
  const allPoints = useMemo(() => sortedPoints(data?.data_points ?? []), [data]);
  const portalStatus = useMemo(
    () => parsePortalDataStatus(data?.portal_data_status),
    [data?.portal_data_status],
  );
  const filtered = useMemo(
    () => filterByPeriod(allPoints, domain, period),
    [allPoints, domain, period],
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <MetricState Icon={Info} title="Unable to load health data" body={error} />
      </div>
    );
  }

  if (!data || data.analysis_count === 0 || allPoints.length === 0) {
    return (
      <DatasetEmptyState
        status={data?.data_status}
        portalStatus={portalStatus}
      />
    );
  }

  const meta = DOMAIN_META[domain];
  const { Icon } = meta;

  return (
    <div className="flex flex-col gap-6">
      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                {meta.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {meta.subtitle}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {filtered.rangeLabel} · {filtered.points.length} stored days
              </p>
            </div>
          </div>
          <PeriodSwitcher period={period} onChange={setPeriod} />
        </div>
      </div>

      <DarthStatePanel sections={sections} />

      {!filtered.hasDomainDataInRange ? (
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
              allPoints={allPoints}
              sections={sections}
              rangeLabel={filtered.rangeLabel}
            />
          )}
          {domain === "recovery" && (
            <RecoveryDashboard
              points={filtered.points}
              allPoints={allPoints}
              sections={sections}
              rangeLabel={filtered.rangeLabel}
            />
          )}
          {domain === "activity" && (
            <ActivityDashboard
              points={filtered.points}
              rangeLabel={filtered.rangeLabel}
              sections={sections}
            />
          )}
        </>
      )}
    </div>
  );
}
