"use client";

import type { PortalDataStatus } from "@/lib/portal-data-status";
import { parsePortalDataStatus } from "@/lib/portal-data-status";
import {
  alignTrendSeries,
  buildDataLabCsv,
  describeTrend,
  filterTrendPoints,
  latestValidDate,
  type DataLabPeriod,
  type DataLabTrendPoint,
  type DescriptiveStatistics,
  type NamedTrendSeries,
} from "@/lib/data-lab-statistics";
import { useLocale } from "@/components/providers/locale-provider";
import type { EChartsOption } from "echarts";
import {
  Activity,
  CalendarRange,
  Database,
  Download,
  Heart,
  Moon,
  Sigma,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const dynamic = "force-dynamic";

// Lazy-load echarts
async function getEcharts() {
  const echarts = await import("echarts/core");
  const { LineChart, BarChart, HeatmapChart } = await import("echarts/charts");
  const {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    VisualMapComponent,
  } = await import("echarts/components");
  const { CanvasRenderer } = await import("echarts/renderers");
  echarts.use([
    LineChart,
    BarChart,
    HeatmapChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    VisualMapComponent,
    CanvasRenderer,
  ]);
  return echarts;
}

const LIGHT_TEXT = "#E5E7EB";
const TOOLTIP_TEXT = "#111827";
const TOOLTIP_BG = "#F9FAFB";
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS = {
  sleep: "#3dbe73",
  hr: "#e5a336",
  hrv: "#6366f1",
  steps: "#5eead4",
  activity: "#f59e0b",
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

type TrendPoint = DataLabTrendPoint;

interface TrendsData {
  trends: {
    sleep: TrendPoint[];
    hrv: TrendPoint[];
    hr: TrendPoint[];
    steps: TrendPoint[];
    activity: TrendPoint[];
    correlations: Record<string, unknown> | null;
    baseline: Record<string, unknown> | null;
    volatility: Record<string, unknown> | null;
  };
  analysis_count: number;
  feature_contract_version?: string;
  feature_quality_status?: "pass" | "warning" | "reject" | null;
  portal_data_status?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function formatDate(d: string, locale: string): string {
  return new Date(d).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function computeTrendDirection(vals: number[]): "rising" | "falling" | "stable" {
  if (vals.length < 4) return "stable";
  const half = Math.floor(vals.length / 2);
  const firstHalf = vals.slice(0, half);
  const secondHalf = vals.slice(half);
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const pct = ((avgSecond - avgFirst) / (avgFirst || 1)) * 100;
  if (pct > 5) return "rising";
  if (pct < -5) return "falling";
  return "stable";
}

function trendNarrative(
  signal: string,
  vals: number[],
  unit: string,
  copy: {
    rising: string;
    falling: string;
    stable: string;
  },
): string {
  if (vals.length === 0) return "";
  const direction = computeTrendDirection(vals);
  const mean = avg(vals)!;
  const latest = vals[vals.length - 1];
  if (direction === "rising") {
    return copy.rising
      .replace("{signal}", signal)
      .replace("{latest}", latest.toFixed(1))
      .replaceAll("{unit}", unit)
      .replace("{mean}", mean.toFixed(1));
  }
  if (direction === "falling") {
    return copy.falling
      .replace("{signal}", signal)
      .replace("{latest}", latest.toFixed(1))
      .replaceAll("{unit}", unit)
      .replace("{mean}", mean.toFixed(1));
  }
  return copy.stable
    .replace("{signal}", signal)
    .replace("{mean}", mean.toFixed(1))
    .replaceAll("{unit}", unit)
    .replace("{count}", String(vals.length));
}

function hasTrendPoints(points: TrendPoint[]): boolean {
  return points.some((point) => point.value != null);
}

function hasObjectData(value: Record<string, unknown> | null): boolean {
  return Boolean(value && Object.keys(value).length > 0);
}

// ---------------------------------------------------------------------------
// Reusable section chart component
// ---------------------------------------------------------------------------

function SectionChart({
  dates,
  series,
  height = 220,
}: Readonly<{
  dates: string[];
  series: {
    name: string;
    data: Array<number | null>;
    color: string;
    yAxisIndex?: number;
  }[];
  height?: number;
}>) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const axisLabelColor = isDark ? LIGHT_TEXT : "#5f6368";
      const splitLineColor = isDark
        ? "rgba(229, 231, 235, 0.09)"
        : "rgba(148, 163, 184, 0.18)";

      const hasSecondAxis = series.some((s) => s.yAxisIndex === 1);

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: TOOLTIP_BG,
          borderColor: "rgba(148, 163, 184, 0.22)",
          borderWidth: 1,
          textStyle: { color: TOOLTIP_TEXT, fontSize: 12 },
          extraCssText:
            "box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); border-radius: 12px;",
        },
        legend: {
          data: series.map((s) => s.name),
          textStyle: { color: axisLabelColor, fontSize: 11 },
          top: 0,
        },
        grid: { left: 44, right: hasSecondAxis ? 44 : 16, top: 32, bottom: 24 },
        xAxis: {
          type: "category",
          data: dates.map((date) => formatDate(date, locale)),
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisLine: { lineStyle: { color: "transparent" } },
          axisTick: { show: false },
        },
        yAxis: hasSecondAxis
          ? [
              {
                type: "value",
                axisLabel: { fontSize: 10, color: axisLabelColor },
                splitLine: {
                  lineStyle: { color: splitLineColor, type: "dashed" },
                },
              },
              {
                type: "value",
                axisLabel: { fontSize: 10, color: axisLabelColor },
                splitLine: { show: false },
              },
            ]
          : {
              type: "value",
              axisLabel: { fontSize: 10, color: axisLabelColor },
              splitLine: {
                lineStyle: { color: splitLineColor, type: "dashed" },
              },
            },
        series: series.map((s) => ({
          name: s.name,
          data: s.data,
          type: "line" as const,
          smooth: true,
          symbol: "circle",
          symbolSize: 5,
          yAxisIndex: s.yAxisIndex ?? 0,
          lineStyle: {
            width: 2.5,
            color: s.color,
            shadowBlur: 10,
            shadowColor: `${s.color}22`,
          },
          itemStyle: { color: s.color },
          areaStyle: { color: `${s.color}18` },
        })),
      };

      chart.setOption(option);
      const observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    })();

    return () => {
      disposed = true;
      chart?.dispose();
    };
  }, [dates, series, height, locale]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}

// ---------------------------------------------------------------------------
// Weekly Patterns Chart
// ---------------------------------------------------------------------------

function WeeklyPatternsChart({
  sleepByDay,
}: Readonly<{ sleepByDay: Array<number | null> }>) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const axisLabelColor = isDark ? LIGHT_TEXT : "#5f6368";
      const splitLineColor = isDark
        ? "rgba(229, 231, 235, 0.09)"
        : "rgba(148, 163, 184, 0.18)";

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: TOOLTIP_BG,
          textStyle: { color: TOOLTIP_TEXT, fontSize: 12 },
        },
        grid: { left: 40, right: 16, top: 12, bottom: 24 },
        xAxis: {
          type: "category",
          data: WEEK_DAYS,
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisLine: { lineStyle: { color: "transparent" } },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          axisLabel: { fontSize: 10, color: axisLabelColor },
          splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
        },
        series: [
          {
            data: sleepByDay,
            type: "bar",
            barWidth: "50%",
            itemStyle: {
              color: COLORS.sleep,
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };

      chart.setOption(option);
      const observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    })();

    return () => {
      disposed = true;
      chart?.dispose();
    };
  }, [sleepByDay]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          {t.portal.dataLab.weeklySleepPatterns}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t.portal.dataLab.weeklySleepPatternsDescription}
        </span>
      </div>
      <div ref={containerRef} className="h-48 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Baseline Ranges Chart
// ---------------------------------------------------------------------------

function extractBaselineRanges(
  baseline: Record<string, unknown> | null,
  definitions: Array<{ key: string; label: string; scale: number }>,
) {
  const metrics =
    (baseline as Record<string, Record<string, Record<string, number>>> | null)
      ?.metrics ?? {};
  return definitions.flatMap((definition) => {
    const metric = metrics[definition.key];
    if (
      !metric ||
      !Number.isFinite(metric.p25) ||
      !Number.isFinite(metric.median) ||
      !Number.isFinite(metric.p75)
    ) {
      return [];
    }
    return [{
      label: definition.label,
      low: metric.p25 * definition.scale,
      median: metric.median * definition.scale,
      high: metric.p75 * definition.scale,
    }];
  });
}

function BaselineRangesChart({
  baseline,
}: Readonly<{ baseline: Record<string, unknown> | null }>) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  const ranges = useMemo(
    () => extractBaselineRanges(baseline, [
      { key: "sleep_hours", label: `${t.portal.dataLab.sleepDuration} (h)`, scale: 1 },
      { key: "hrv_sdnn_mean", label: `${t.common.metrics.hrv} (ms)`, scale: 1 },
      { key: "hr_mean", label: `${t.portal.dataLab.heartRate} (bpm)`, scale: 1 },
      { key: "total_steps", label: `${t.portal.dataLab.dailySteps} (k)`, scale: 0.001 },
    ]),
    [
      baseline,
      t.common.metrics.hrv,
      t.portal.dataLab.dailySteps,
      t.portal.dataLab.heartRate,
      t.portal.dataLab.sleepDuration,
    ],
  );
  const hasRanges = ranges.length > 0;

  useEffect(() => {
    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const axisLabelColor = isDark ? LIGHT_TEXT : "#5f6368";
      const splitLineColor = isDark
        ? "rgba(229, 231, 235, 0.09)"
        : "rgba(148, 163, 184, 0.18)";

      if (ranges.length === 0) return;
      const metrics = ranges.map((range) => range.label);
      const baselines = ranges.map((range) => range.median);
      const lows = ranges.map((range) => range.low);
      const highs = ranges.map((range) => range.high);

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: TOOLTIP_BG,
          textStyle: { color: TOOLTIP_TEXT, fontSize: 12 },
        },
        grid: { left: 100, right: 16, top: 12, bottom: 24 },
        xAxis: {
          type: "value",
          axisLabel: { fontSize: 10, color: axisLabelColor },
          splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
        },
        yAxis: {
          type: "category",
          data: metrics,
          axisLabel: { fontSize: 11, color: axisLabelColor },
          axisTick: { show: false },
          axisLine: { show: false },
        },
        series: [
          {
            name: "Low",
            type: "bar",
            stack: "range",
            data: lows,
            itemStyle: { color: "transparent" },
            emphasis: { disabled: true },
          },
          {
            name: "Range",
            type: "bar",
            stack: "range",
            data: baselines.map((_, i) => highs[i] - lows[i]),
            itemStyle: {
              color: isDark
                ? "rgba(99, 102, 241, 0.35)"
                : "rgba(99, 102, 241, 0.2)",
              borderRadius: [0, 4, 4, 0],
            },
            label: {
              show: true,
              position: "inside",
              formatter: (params: { dataIndex: number }) =>
                baselines[params.dataIndex].toFixed(1),
              fontSize: 11,
              color: isDark ? "#e5e7eb" : "#374151",
            },
          },
        ],
      };

      chart.setOption(option);
      const observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    })();

    return () => {
      disposed = true;
      chart?.dispose();
    };
  }, [ranges]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          {t.portal.dataLab.baselineRangesTitle}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t.portal.dataLab.baselineRangesDescription}
        </span>
      </div>
      {hasRanges ? (
        <div ref={containerRef} className="h-48 w-full" />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t.portal.dataLab.baselineUnavailable}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Correlation Heatmap (secondary)
// ---------------------------------------------------------------------------

function CorrelationHeatmapChart({
  correlations,
}: Readonly<{ correlations: Record<string, unknown> | null }>) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const axisLabelColor = isDark ? LIGHT_TEXT : "#5f6368";

      const metrics = [
        t.portal.dataLab.sleepDuration,
        t.common.metrics.hrv,
        t.portal.dataLab.heartRate,
        t.portal.dataLab.dailySteps,
        t.portal.dataLab.activeMinutes,
      ];
      const corrData: number[][] = [];
      if (correlations && typeof correlations === "object") {
        const matrix = correlations as Record<string, Record<string, number>>;
        const keys = [
          "sleep_hours",
          "hrv_sdnn_mean",
          "hr_mean",
          "total_steps",
          "active_minutes",
        ];
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0; j < keys.length; j++) {
            const val = matrix[keys[i]]?.[keys[j]];
            if (typeof val === "number" && Number.isFinite(val)) {
              corrData.push([i, j, Math.round(val * 100) / 100]);
            }
          }
        }
      }

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          position: "top",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const d = params.data;
            return `${metrics[d[0]]} \u00d7 ${metrics[d[1]]}: ${d[2].toFixed(2)}`;
          },
        },
        grid: { left: 80, right: 60, top: 12, bottom: 40 },
        xAxis: {
          type: "category",
          data: metrics,
          axisLabel: { fontSize: 10, color: axisLabelColor, rotate: 0 },
          axisTick: { show: false },
          axisLine: { show: false },
          splitArea: { show: true },
        },
        yAxis: {
          type: "category",
          data: metrics,
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisTick: { show: false },
          axisLine: { show: false },
          splitArea: { show: true },
        },
        visualMap: {
          min: -1,
          max: 1,
          calculable: true,
          orient: "vertical",
          right: 0,
          top: "center",
          textStyle: { color: axisLabelColor, fontSize: 10 },
          inRange: {
            color: ["#3b82f6", "#f8fafc", "#ef4444"],
          },
        },
        series: [
          {
            type: "heatmap",
            data: corrData,
            label: {
              show: true,
              fontSize: 10,
              color: isDark ? "#fff" : "#111",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: (params: any) => params.data[2].toFixed(2),
            },
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.3)" },
            },
          },
        ],
      };

      chart.setOption(option);
      const observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    })();

    return () => {
      disposed = true;
      chart?.dispose();
    };
  }, [correlations]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          {t.portal.dataLab.signalCorrelations}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t.portal.dataLab.correlationsAvailable}
        </span>
      </div>
      <div ref={containerRef} className="h-72 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  unit,
  count,
}: Readonly<{ label: string; value: string; unit: string; count: number }>) {
  const { t } = useLocale();
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="text-lg font-bold text-card-foreground">
        {value}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
      <p className="text-[10px] text-muted-foreground">
        {t.portal.dataLab.dataPoints.replace("{count}", String(count))}
      </p>
    </div>
  );
}

function DataLabHeader({
  contractVersion,
  qualityStatus,
}: Readonly<{
  contractVersion?: string;
  qualityStatus?: "pass" | "warning" | "reject" | null;
}>) {
  const { t } = useLocale();
  const qualityLabel =
    qualityStatus === "pass"
      ? t.portal.dataLab.qualityPass
      : qualityStatus === "warning"
        ? t.portal.dataLab.qualityWarning
        : qualityStatus === "reject"
          ? t.portal.dataLab.qualityReject
          : null;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">
          {t.portal.dataLab.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.portal.dataLab.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1">
          {t.portal.dataLab.advancedReference}
        </span>
        <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1">
          {t.portal.dataLab.correlationDisclaimer}
        </span>
        {contractVersion && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
            {t.portal.dataLab.scientificContract}: {contractVersion.replace("user_feature_store.", "Feature Store ")}
          </span>
        )}
        {qualityLabel && (
          <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1">
            {t.portal.dataLab.extractionQuality}: {qualityLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: Readonly<{
  value: DataLabPeriod;
  onChange: (period: DataLabPeriod) => void;
}>) {
  const { t } = useLocale();
  const periods: Array<{ value: DataLabPeriod; label: string }> = [
    { value: "30d", label: t.portal.dataLab.period30Days },
    { value: "90d", label: t.portal.dataLab.period90Days },
    { value: "all", label: t.portal.dataLab.periodAll },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t.portal.dataLab.periodLabel}>
      <CalendarRange className="h-4 w-4 text-muted-foreground" />
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        {t.portal.dataLab.periodLabel}
      </span>
      <div className="flex rounded-lg border border-border/70 bg-muted/20 p-1">
        {periods.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => onChange(period.value)}
            aria-pressed={value === period.value}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              value === period.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StatisticsRow {
  key: string;
  label: string;
  unit: string;
  statistics: DescriptiveStatistics;
}

function formatStatistic(
  value: number | null,
  locale: string,
  maximumFractionDigits = 1,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(locale, { maximumFractionDigits });
}

function formatPercentage(value: number | null, locale: string): string {
  return value == null ? "—" : `${formatStatistic(value * 100, locale)}%`;
}

function EvidenceSummary({
  analysisCount,
  rows,
  onExport,
}: Readonly<{
  analysisCount: number;
  rows: StatisticsRow[];
  onExport: () => void;
}>) {
  const { t, locale } = useLocale();
  const availableRows = rows.filter((row) => row.statistics.observations > 0);
  const observations = availableRows.reduce(
    (total, row) => total + row.statistics.observations,
    0,
  );
  const timestamps = availableRows.flatMap((row) => [
    row.statistics.firstDate,
    row.statistics.lastDate,
  ]).filter((date): date is string => Boolean(date));
  timestamps.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const dateRange = timestamps.length > 0
    ? `${formatDate(timestamps[0], locale)} – ${formatDate(timestamps[timestamps.length - 1], locale)}`
    : t.portal.dataLab.noData;
  const facts = [
    { label: t.portal.dataLab.analyses, value: analysisCount.toLocaleString(locale) },
    { label: t.portal.dataLab.observations, value: observations.toLocaleString(locale) },
    { label: t.portal.dataLab.signals, value: availableRows.length.toLocaleString(locale) },
    { label: t.portal.dataLab.dateRange, value: dateRange },
  ];

  return (
    <section className="portal-panel overflow-hidden rounded-2xl border border-border/70 bg-card/90">
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-card-foreground">
              {t.portal.dataLab.evidenceWindow}
            </h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            {t.portal.dataLab.evidenceWindowDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={observations === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          {t.portal.dataLab.exportCsv}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/50 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-card px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {fact.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-card-foreground">{fact.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DescriptiveStatisticsTable({ rows }: Readonly<{ rows: StatisticsRow[] }>) {
  const { t, locale } = useLocale();
  const headings = [
    t.portal.dataLab.signal,
    "N",
    t.portal.dataLab.missing,
    t.portal.dataLab.coverage,
    t.portal.dataLab.mean,
    t.portal.dataLab.median,
    t.portal.dataLab.standardDeviation,
    t.portal.dataLab.coefficientVariation,
    t.portal.dataLab.range,
    t.portal.dataLab.maxGap,
  ];

  return (
    <section className="portal-panel overflow-hidden rounded-2xl border border-border/70 bg-card/90">
      <div className="border-b border-border/60 p-5">
        <div className="flex items-center gap-2">
          <Sigma className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-card-foreground">
            {t.portal.dataLab.descriptiveStatistics}
          </h2>
        </div>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          {t.portal.dataLab.descriptiveStatisticsDescription}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>{headings.map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row) => {
              const stats = row.statistics;
              return (
                <tr key={row.key} className="text-card-foreground">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">{row.label}</th>
                  <td className="px-4 py-3 tabular-nums">{stats.observations}</td>
                  <td className="px-4 py-3 tabular-nums">{stats.missingValues}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPercentage(stats.observedDayCoverage, locale)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatStatistic(stats.mean, locale)} {row.unit}</td>
                  <td className="px-4 py-3 tabular-nums">{formatStatistic(stats.median, locale)} {row.unit}</td>
                  <td className="px-4 py-3 tabular-nums">{formatStatistic(stats.standardDeviation, locale)} {row.unit}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPercentage(stats.coefficientOfVariation, locale)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatStatistic(stats.minimum, locale)}–{formatStatistic(stats.maximum, locale)} {row.unit}</td>
                  <td className="px-4 py-3 tabular-nums">{stats.maximumGapDays == null ? "—" : `${stats.maximumGapDays} ${t.portal.dataLab.days}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Trend section with narrative + chart
// ---------------------------------------------------------------------------

function TrendSection({
  icon,
  title,
  description,
  narrative,
  children,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  narrative: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground max-w-2xl">
        {description}
      </p>
      {narrative && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {narrative}
        </p>
      )}
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Biggest change detection
// ---------------------------------------------------------------------------

function detectBiggestChange(
  sleepVals: number[],
  hrvVals: number[],
  hrVals: number[],
  stepVals: number[],
  copy: {
    sleepDuration: string;
    restingHeartRate: string;
    dailySteps: string;
    hours: string;
    steps: string;
    biggestChangeIncreased: string;
    biggestChangeDecreased: string;
  },
): string | null {
  const signals: { name: string; vals: number[]; unit: string }[] = [
    { name: copy.sleepDuration, vals: sleepVals, unit: copy.hours },
    { name: "HRV", vals: hrvVals, unit: "ms" },
    { name: copy.restingHeartRate, vals: hrVals, unit: "bpm" },
    { name: copy.dailySteps, vals: stepVals, unit: copy.steps },
  ];

  let biggest = "";
  let biggestPct = 0;

  for (const s of signals) {
    if (s.vals.length < 4) continue;
    const half = Math.floor(s.vals.length / 2);
    const first = s.vals.slice(0, half);
    const second = s.vals.slice(half);
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
    const pct = Math.abs(((avgSecond - avgFirst) / (avgFirst || 1)) * 100);
    if (pct > biggestPct) {
      biggestPct = pct;
      const template =
        avgSecond > avgFirst
          ? copy.biggestChangeIncreased
          : copy.biggestChangeDecreased;
      biggest = template
        .replace("{signal}", s.name)
        .replace("{pct}", pct.toFixed(0));
    }
  }

  return biggestPct > 5 ? biggest : null;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyTrendsState({
  message,
}: Readonly<{ message: string }>) {
  return (
    <div className="flex flex-col gap-6">
      <DataLabHeader />
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
        <TrendingUpIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {message}
        </p>
      </div>
    </div>
  );
}

function InlineDataLabEmptyState({
  message,
}: Readonly<{ message: string }>) {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function TechnicalAvailability({
  hasTrendData,
  hasBaseline,
  hasCorrelations,
  hasVolatility,
}: Readonly<{
  hasTrendData: boolean;
  hasBaseline: boolean;
  hasCorrelations: boolean;
  hasVolatility: boolean;
}>) {
  const { t } = useLocale();
  const items = [
    {
      label: t.portal.dataLab.trendCharts,
      available: hasTrendData,
      message: hasTrendData
        ? t.portal.dataLab.trendChartsAvailable
        : t.portal.dataLab.trendChartsUnavailable,
    },
    {
      label: t.portal.dataLab.baselineRanges,
      available: hasBaseline,
      message: hasBaseline
        ? t.portal.dataLab.baselineRangesDescription
        : t.portal.dataLab.baselineUnavailable,
    },
    {
      label: t.portal.dataLab.correlations,
      available: hasCorrelations,
      message: hasCorrelations
        ? t.portal.dataLab.correlationsAvailable
        : t.portal.dataLab.correlationsUnavailable,
    },
    {
      label: t.portal.dataLab.volatility,
      available: hasVolatility,
      message: hasVolatility
        ? t.portal.dataLab.volatilityAvailable
        : t.portal.dataLab.volatilityUnavailable,
    },
  ];

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t.portal.dataLab.technicalDataAvailable}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.portal.dataLab.technicalDataDescription}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-card-foreground">
                {item.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.available
                  ? t.portal.dataLab.available
                  : t.portal.dataLab.unavailableLabel}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrendsPage() {
  const { t, locale } = useLocale();
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [portalStatus, setPortalStatus] = useState<PortalDataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<DataLabPeriod>("90d");

  useEffect(() => {
    (async () => {
      try {
        const trendsRes = await fetch("/api/proxy/users/portal-trends");

        if (trendsRes.ok) {
          const payload = (await trendsRes.json()) as TrendsData;
          setTrendsData(payload);
          setPortalStatus(parsePortalDataStatus(payload.portal_data_status));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const extractVals = useCallback(
    (points: TrendPoint[]): number[] =>
      points.filter((p) => p.value != null).map((p) => p.value as number),
    [],
  );

  const extractDts = useCallback(
    (points: TrendPoint[]): string[] =>
      points.filter((p) => p.value != null).map((p) => p.date),
    [],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <DataLabHeader
          contractVersion={trendsData?.feature_contract_version}
          qualityStatus={trendsData?.feature_quality_status}
        />
        <p className="text-sm text-muted-foreground">{t.portal.dataLab.loading}</p>
      </div>
    );
  }

  if (!trendsData) {
    return (
      <EmptyTrendsState message={t.portal.dataLab.loadError} />
    );
  }

  if (trendsData.analysis_count === 0 || portalStatus?.analysisStatus === "no_analysis") {
    return (
      <EmptyTrendsState message={t.portal.dataLab.empty} />
    );
  }

  if (portalStatus && !portalStatus.hasLegacyScientificData) {
    return (
      <EmptyTrendsState message={t.portal.dataLab.unavailable} />
    );
  }

  const rawTrends = trendsData.trends;
  const latestDate = latestValidDate([
    rawTrends.sleep,
    rawTrends.hrv,
    rawTrends.hr,
    rawTrends.steps,
    rawTrends.activity,
  ]);
  const trends = {
    ...rawTrends,
    sleep: filterTrendPoints(rawTrends.sleep, period, latestDate),
    hrv: filterTrendPoints(rawTrends.hrv, period, latestDate),
    hr: filterTrendPoints(rawTrends.hr, period, latestDate),
    steps: filterTrendPoints(rawTrends.steps, period, latestDate),
    activity: filterTrendPoints(rawTrends.activity, period, latestDate),
  };
  const namedSeries: NamedTrendSeries[] = [
    { key: "sleep_hours", points: trends.sleep },
    { key: "hrv_sdnn_ms", points: trends.hrv },
    { key: "resting_heart_rate_bpm", points: trends.hr },
    { key: "daily_steps", points: trends.steps },
    { key: "active_minutes", points: trends.activity },
  ];
  const statisticsRows: StatisticsRow[] = [
    { key: "sleep", label: t.portal.dataLab.sleepDuration, unit: "h", statistics: describeTrend(trends.sleep) },
    { key: "hrv", label: t.common.metrics.hrv, unit: "ms", statistics: describeTrend(trends.hrv) },
    { key: "hr", label: t.portal.dataLab.restingHeartRate, unit: "bpm", statistics: describeTrend(trends.hr) },
    { key: "steps", label: t.portal.dataLab.dailySteps, unit: t.portal.dataLab.steps, statistics: describeTrend(trends.steps) },
    { key: "activity", label: t.portal.dataLab.activeMinutes, unit: "min", statistics: describeTrend(trends.activity) },
  ];
  const recoverySeries = alignTrendSeries([
    { key: "hrv", points: trends.hrv },
    { key: "hr", points: trends.hr },
  ]);
  const activitySeries = alignTrendSeries([
    { key: "steps", points: trends.steps },
    { key: "activity", points: trends.activity },
  ]);
  const sleepVals = extractVals(trends.sleep);
  const hrvVals = extractVals(trends.hrv);
  const hrVals = extractVals(trends.hr);
  const stepVals = extractVals(trends.steps);
  const activityVals = extractVals(trends.activity);
  const sleepDates = extractDts(trends.sleep);

  // Summary stats
  const avgSleep = avg(sleepVals);
  const avgHrv = avg(hrvVals);
  const avgHr = avg(hrVals);
  const avgSteps = avg(stepVals);

  // Narratives
  const sleepNarrative = trendNarrative(t.portal.dataLab.sleepDuration, sleepVals, t.portal.dataLab.hours, t.portal.dataLab.trendNarrative);
  const recoveryNarrative =
    hrvVals.length > 0
      ? trendNarrative(t.common.metrics.hrv, hrvVals, "ms", t.portal.dataLab.trendNarrative)
      : hrVals.length > 0
        ? trendNarrative(t.portal.dataLab.restingHeartRate, hrVals, "bpm", t.portal.dataLab.trendNarrative)
        : "";
  const activityNarrative =
    stepVals.length > 0
      ? trendNarrative(t.portal.dataLab.dailySteps, stepVals, t.portal.dataLab.steps, t.portal.dataLab.trendNarrative)
      : activityVals.length > 0
        ? trendNarrative(t.portal.dataLab.activeMinutes, activityVals, "minutes", t.portal.dataLab.trendNarrative)
        : "";

  // Biggest change
  const biggestChange = detectBiggestChange(
    sleepVals,
    hrvVals,
    hrVals,
    stepVals,
    t.portal.dataLab,
  );

  // Weekly sleep patterns
  const sleepByDay = WEEK_DAYS.map((_, i) => {
    const dayIdx = i === 6 ? 0 : i + 1;
    const vals = sleepVals.filter((_, j) => {
      if (!sleepDates[j]) return false;
      const parsed = new Date(sleepDates[j]);
      return !isNaN(parsed.getTime()) && parsed.getDay() === dayIdx;
    });
    return vals.length
      ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : null;
  });

  const hasSleep = sleepVals.length > 0;
  const hasRecovery = hrvVals.length > 0 || hrVals.length > 0;
  const hasActivity = stepVals.length > 0 || activityVals.length > 0;
  const hasTrendData = [
    rawTrends.sleep,
    rawTrends.hrv,
    rawTrends.hr,
    rawTrends.steps,
    rawTrends.activity,
  ].some(hasTrendPoints);
  const hasBaseline = hasObjectData(rawTrends.baseline);
  const hasCorrelations = hasObjectData(rawTrends.correlations);
  const hasVolatility = hasObjectData(rawTrends.volatility);

  const exportCsv = () => {
    const csv = buildDataLabCsv(namedSeries);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `engage7-data-lab-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      <DataLabHeader
        contractVersion={trendsData.feature_contract_version}
        qualityStatus={trendsData.feature_quality_status}
      />

      <PeriodSelector value={period} onChange={setPeriod} />

      <EvidenceSummary
        analysisCount={trendsData.analysis_count}
        rows={statisticsRows}
        onExport={exportCsv}
      />

      <DescriptiveStatisticsTable rows={statisticsRows} />

      <TechnicalAvailability
        hasTrendData={hasTrendData}
        hasBaseline={hasBaseline}
        hasCorrelations={hasCorrelations}
        hasVolatility={hasVolatility}
      />

      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {avgSleep != null && (
          <StatCard
            label={t.portal.dataLab.averageSleep}
            value={avgSleep.toFixed(1)}
            unit={t.portal.dataLab.hours}
            count={sleepVals.length}
          />
        )}
        {avgHrv != null && (
          <StatCard
            label={t.portal.dataLab.averageHrv}
            value={Math.round(avgHrv).toString()}
            unit="ms"
            count={hrvVals.length}
          />
        )}
        {avgHr != null && (
          <StatCard
            label={t.portal.dataLab.averageHeartRate}
            value={Math.round(avgHr).toString()}
            unit="bpm"
            count={hrVals.length}
          />
        )}
        {avgSteps != null && (
          <StatCard
            label={t.portal.dataLab.averageDailySteps}
            value={avgSteps.toLocaleString(locale, {
              maximumFractionDigits: 0,
            })}
            unit={t.portal.dataLab.steps}
            count={stepVals.length}
          />
        )}
      </div>

      {/* Sleep Trend */}
      {hasSleep && (
        <TrendSection
          icon={<Moon className="h-4 w-4 text-[#3dbe73]" />}
          title={t.portal.dataLab.sleepTrend}
          description={t.portal.dataLab.trendChartsAvailable}
          narrative={sleepNarrative}
        >
          <SectionChart
            dates={sleepDates}
            series={[
              {
                name: t.portal.dataLab.sleepDuration,
                data: sleepVals,
                color: COLORS.sleep,
              },
            ]}
          />
        </TrendSection>
      )}

      {/* Recovery Trend */}
      {hasRecovery && (
        <TrendSection
          icon={<Heart className="h-4 w-4 text-[#6366f1]" />}
          title={t.portal.dataLab.recoveryTrend}
          description={t.portal.dataLab.trendChartsAvailable}
          narrative={recoveryNarrative}
        >
          <SectionChart
            dates={recoverySeries.dates}
            series={[
              ...(hrvVals.length > 0
                ? [{ name: `${t.common.metrics.hrv} (ms)`, data: recoverySeries.values.hrv, color: COLORS.hrv }]
                : []),
              ...(hrVals.length > 0
                ? [
                    {
                      name: t.portal.dataLab.restingHeartRate,
                      data: recoverySeries.values.hr,
                      color: COLORS.hr,
                      yAxisIndex: hrvVals.length > 0 ? 1 : 0,
                    },
                  ]
                : []),
            ]}
          />
        </TrendSection>
      )}

      {/* Activity Trend */}
      {hasActivity && (
        <TrendSection
          icon={<Activity className="h-4 w-4 text-[#f59e0b]" />}
          title={t.portal.dataLab.activityTrend}
          description={t.portal.dataLab.trendChartsAvailable}
          narrative={activityNarrative}
        >
          <SectionChart
            dates={activitySeries.dates}
            series={[
              ...(stepVals.length > 0
                ? [
                    {
                      name: t.portal.dataLab.dailySteps,
                      data: activitySeries.values.steps,
                      color: COLORS.steps,
                    },
                  ]
                : []),
              ...(activityVals.length > 0
                ? [
                    {
                      name: t.portal.dataLab.activeMinutes,
                      data: activitySeries.values.activity,
                      color: COLORS.activity,
                      yAxisIndex: stepVals.length > 0 ? 1 : 0,
                    },
                  ]
                : []),
            ]}
          />
        </TrendSection>
      )}

      {/* What Changed Most */}
      {biggestChange && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t.portal.dataLab.whatChangedMost}
            </h2>
          </div>
          <div className="portal-panel rounded-xl border border-accent/20 bg-accent/[0.03] px-5 py-4">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {biggestChange}
            </p>
          </div>
        </div>
      )}

      {/* Baseline ranges */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          {t.portal.dataLab.baselineRanges}
        </summary>
        <p className="mt-2 text-xs text-muted-foreground max-w-2xl">
          {t.portal.dataLab.baselineRangesDescription}
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {hasSleep && <WeeklyPatternsChart sleepByDay={sleepByDay} />}
          {hasBaseline ? (
            <BaselineRangesChart baseline={trends.baseline} />
          ) : (
            <InlineDataLabEmptyState message={t.portal.dataLab.baselineUnavailable} />
          )}
        </div>
      </details>

      {/* Correlations (secondary) */}
      {hasCorrelations && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            {t.portal.dataLab.signalCorrelationsReference}
          </summary>
          <p className="mt-2 text-xs text-muted-foreground max-w-2xl">
            {t.portal.dataLab.correlationsAvailable}
          </p>
          <div className="mt-3">
            <CorrelationHeatmapChart correlations={trends.correlations} />
          </div>
        </details>
      )}
    </div>
  );
}
