"use client";

import { DarthStatePanel } from "@/components/portal/darth-state-panel";
import type { EChartsOption } from "echarts";
import {
  Activity,
  Heart,
  Moon,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

interface TrendPoint {
  date: string;
  value: number | null;
}

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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IE", {
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
): string {
  if (vals.length === 0) return "";
  const direction = computeTrendDirection(vals);
  const mean = avg(vals)!;
  const latest = vals[vals.length - 1];
  if (direction === "rising")
    return `Your ${signal} has been trending upward, currently around ${latest.toFixed(1)} ${unit} (average: ${mean.toFixed(1)} ${unit}).`;
  if (direction === "falling")
    return `Your ${signal} has been trending downward, currently around ${latest.toFixed(1)} ${unit} (average: ${mean.toFixed(1)} ${unit}).`;
  return `Your ${signal} has been stable around ${mean.toFixed(1)} ${unit} across ${vals.length} data points.`;
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
    data: number[];
    color: string;
    yAxisIndex?: number;
  }[];
  height?: number;
}>) {
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
          data: dates.map(formatDate),
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
  }, [dates, series, height]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}

// ---------------------------------------------------------------------------
// Weekly Patterns Chart
// ---------------------------------------------------------------------------

function WeeklyPatternsChart({
  sleepByDay,
}: Readonly<{ sleepByDay: number[] }>) {
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
          Weekly Sleep Patterns
        </h3>
        <span className="text-xs text-muted-foreground">
          Average sleep by day of week
        </span>
      </div>
      <div ref={containerRef} className="h-48 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Baseline Ranges Chart
// ---------------------------------------------------------------------------

function BaselineRangesChart({
  baseline,
}: Readonly<{ baseline: Record<string, unknown> | null }>) {
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

      const bMetrics =
        (baseline as Record<string, Record<string, Record<string, number>>>)
          ?.metrics ?? {};
      const sleepM = bMetrics.sleep_hours ?? {};
      const hrvM = bMetrics.hrv_sdnn_mean ?? {};
      const hrM = bMetrics.hr_mean ?? {};
      const stepsM = bMetrics.total_steps ?? {};

      const metrics = ["Sleep (h)", "HRV (ms)", "HR (bpm)", "Steps (k)"];
      const baselines = [
        sleepM.median ?? 7.2,
        hrvM.median ?? 43,
        hrM.median ?? 72,
        (stepsM.median ?? 8500) / 1000,
      ];
      const lows = [
        sleepM.p25 ?? (sleepM.median ? sleepM.median - 0.7 : 6.5),
        hrvM.p25 ?? (hrvM.median ?? 43) - 8,
        hrM.p25 ?? (hrM.median ?? 72) - 7,
        (stepsM.p25 ?? (stepsM.median ?? 8500) - 2500) / 1000,
      ];
      const highs = [
        sleepM.p75 ?? (sleepM.median ?? 7.2) + 0.8,
        hrvM.p75 ?? (hrvM.median ?? 43) + 9,
        hrM.p75 ?? (hrM.median ?? 72) + 8,
        (stepsM.p75 ?? (stepsM.median ?? 8500) + 3500) / 1000,
      ];

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
  }, [baseline]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          Your Baseline Ranges
        </h3>
        <span className="text-xs text-muted-foreground">
          Typical ranges based on your data
        </span>
      </div>
      <div ref={containerRef} className="h-48 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Correlation Heatmap (secondary)
// ---------------------------------------------------------------------------

function CorrelationHeatmapChart({
  correlations,
}: Readonly<{ correlations: Record<string, unknown> | null }>) {
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

      const metrics = ["Sleep", "HRV", "HR", "Steps", "Activity"];
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
            const val = matrix[keys[i]]?.[keys[j]] ?? (i === j ? 1.0 : 0);
            corrData.push([i, j, Math.round(val * 100) / 100]);
          }
        }
      } else {
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            corrData.push([i, j, i === j ? 1.0 : 0]);
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
          Signal Correlations
        </h3>
        <span className="text-xs text-muted-foreground">
          How your signals relate &mdash; for reference only
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
      <p className="text-[10px] text-muted-foreground">{count} data points</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend section with narrative + chart
// ---------------------------------------------------------------------------

function TrendSection({
  icon,
  title,
  narrative,
  children,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
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
): string | null {
  const signals: { name: string; vals: number[]; unit: string }[] = [
    { name: "sleep duration", vals: sleepVals, unit: "hours" },
    { name: "HRV", vals: hrvVals, unit: "ms" },
    { name: "resting heart rate", vals: hrVals, unit: "bpm" },
    { name: "daily steps", vals: stepVals, unit: "steps" },
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
      const dir = avgSecond > avgFirst ? "increased" : "decreased";
      biggest = `Your ${s.name} ${dir} by about ${pct.toFixed(0)}% between the first and second half of your data.`;
    }
  }

  return biggestPct > 5 ? biggest : null;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyTrendsState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
        <TrendingUpIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          No trend data available yet. Upload an Apple Health export to see how
          your signals evolve over time.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrendsPage() {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [latestSections, setLatestSections] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [trendsRes, analysesRes] = await Promise.allSettled([
          fetch("/api/proxy/users/portal-trends"),
          fetch("/api/proxy/users/portal-analyses"),
        ]);

        if (trendsRes.status === "fulfilled" && trendsRes.value.ok) {
          setTrendsData(await trendsRes.value.json());
        }

        if (analysesRes.status === "fulfilled" && analysesRes.value.ok) {
          const analysesData = await analysesRes.value.json();
          const analyses = analysesData.analyses ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const latest = analyses.find((a: any) => a.sections);
          if (latest?.sections) setLatestSections(latest.sections);
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
        <p className="text-sm text-muted-foreground">Loading&hellip;</p>
      </div>
    );
  }

  if (!trendsData || trendsData.analysis_count === 0) {
    return <EmptyTrendsState />;
  }

  const { trends } = trendsData;
  const sleepVals = extractVals(trends.sleep);
  const hrvVals = extractVals(trends.hrv);
  const hrVals = extractVals(trends.hr);
  const stepVals = extractVals(trends.steps);
  const activityVals = extractVals(trends.activity);
  const sleepDates = extractDts(trends.sleep);
  const hrvDates = extractDts(trends.hrv);
  const hrDates = extractDts(trends.hr);
  const stepDates = extractDts(trends.steps);
  const activityDates = extractDts(trends.activity);

  // Summary stats
  const avgSleep = avg(sleepVals);
  const avgHrv = avg(hrvVals);
  const avgHr = avg(hrVals);
  const avgSteps = avg(stepVals);

  // Narratives
  const sleepNarrative = trendNarrative("sleep duration", sleepVals, "hours");
  const recoveryNarrative =
    hrvVals.length > 0
      ? trendNarrative("HRV", hrvVals, "ms")
      : hrVals.length > 0
        ? trendNarrative("resting heart rate", hrVals, "bpm")
        : "";
  const activityNarrative =
    stepVals.length > 0
      ? trendNarrative("daily steps", stepVals, "steps")
      : activityVals.length > 0
        ? trendNarrative("active minutes", activityVals, "minutes")
        : "";

  // Biggest change
  const biggestChange = detectBiggestChange(
    sleepVals,
    hrvVals,
    hrVals,
    stepVals,
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
      : 0;
  });

  const hasSleep = sleepVals.length > 0;
  const hasRecovery = hrvVals.length > 0 || hrVals.length > 0;
  const hasActivity = stepVals.length > 0 || activityVals.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* ─── DARTH State Panel — Sprint 32.0 ─── */}
      <DarthStatePanel sections={latestSections} />

      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {avgSleep != null && (
          <StatCard
            label="Avg Sleep"
            value={avgSleep.toFixed(1)}
            unit="hours"
            count={sleepVals.length}
          />
        )}
        {avgHrv != null && (
          <StatCard
            label="Avg HRV"
            value={Math.round(avgHrv).toString()}
            unit="ms"
            count={hrvVals.length}
          />
        )}
        {avgHr != null && (
          <StatCard
            label="Avg HR"
            value={Math.round(avgHr).toString()}
            unit="bpm"
            count={hrVals.length}
          />
        )}
        {avgSteps != null && (
          <StatCard
            label="Avg Steps"
            value={avgSteps.toLocaleString("en-IE", {
              maximumFractionDigits: 0,
            })}
            unit="steps"
            count={stepVals.length}
          />
        )}
      </div>

      {/* Sleep Trend */}
      {hasSleep && (
        <TrendSection
          icon={<Moon className="h-4 w-4 text-[#3dbe73]" />}
          title="Sleep Trend"
          narrative={sleepNarrative}
        >
          <SectionChart
            dates={sleepDates}
            series={[
              { name: "Sleep (h)", data: sleepVals, color: COLORS.sleep },
            ]}
          />
        </TrendSection>
      )}

      {/* Recovery Trend */}
      {hasRecovery && (
        <TrendSection
          icon={<Heart className="h-4 w-4 text-[#6366f1]" />}
          title="Recovery Trend"
          narrative={recoveryNarrative}
        >
          <SectionChart
            dates={hrvDates.length >= hrDates.length ? hrvDates : hrDates}
            series={[
              ...(hrvVals.length > 0
                ? [{ name: "HRV (ms)", data: hrvVals, color: COLORS.hrv }]
                : []),
              ...(hrVals.length > 0
                ? [
                    {
                      name: "HR (bpm)",
                      data: hrVals,
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
          title="Activity Trend"
          narrative={activityNarrative}
        >
          <SectionChart
            dates={
              stepDates.length >= activityDates.length
                ? stepDates
                : activityDates
            }
            series={[
              ...(stepVals.length > 0
                ? [{ name: "Steps", data: stepVals, color: COLORS.steps }]
                : []),
              ...(activityVals.length > 0
                ? [
                    {
                      name: "Active min",
                      data: activityVals,
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
              What Changed Most
            </h2>
          </div>
          <div className="portal-panel rounded-xl border border-accent/20 bg-accent/[0.03] px-5 py-4">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {biggestChange}
            </p>
          </div>
        </div>
      )}

      {/* Your Normal Pattern */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Normal Pattern
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {hasSleep && <WeeklyPatternsChart sleepByDay={sleepByDay} />}
          <BaselineRangesChart baseline={trends.baseline} />
        </div>
      </div>

      {/* Correlations (secondary) */}
      {trends.correlations && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            Signal Correlations (reference)
          </summary>
          <div className="mt-3">
            <CorrelationHeatmapChart correlations={trends.correlations} />
          </div>
        </details>
      )}
    </div>
  );
}
