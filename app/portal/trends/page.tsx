"use client";

import type { EChartsOption } from "echarts";
import { useCallback, useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic";

// Lazy-load echarts to keep bundle size down
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
// Data types from portal-trends API
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
// Chart 1: Multi-Axis Trends
// ---------------------------------------------------------------------------

function MultiAxisTrendChart({
  days,
  sleep,
  hrv,
  hr,
}: Readonly<{
  days: string[];
  sleep: number[];
  hrv: number[];
  hr: number[];
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

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: TOOLTIP_BG,
          borderColor: "rgba(148, 163, 184, 0.22)",
          borderWidth: 1,
          textStyle: { color: TOOLTIP_TEXT, fontSize: 12 },
        },
        legend: {
          data: ["Sleep (h)", "HRV (ms)", "HR (bpm)"],
          textStyle: { color: axisLabelColor, fontSize: 11 },
          top: 0,
        },
        grid: { left: 50, right: 50, top: 36, bottom: 24 },
        xAxis: {
          type: "category",
          data: days,
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisLine: { lineStyle: { color: "transparent" } },
          axisTick: { show: false },
        },
        yAxis: [
          {
            type: "value",
            name: "Hours / ms",
            nameTextStyle: { color: axisLabelColor, fontSize: 10 },
            axisLabel: { fontSize: 10, color: axisLabelColor },
            splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
          },
          {
            type: "value",
            name: "bpm",
            nameTextStyle: { color: axisLabelColor, fontSize: 10 },
            axisLabel: { fontSize: 10, color: axisLabelColor },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: "Sleep (h)",
            data: sleep,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2, color: COLORS.sleep },
            itemStyle: { color: COLORS.sleep },
            areaStyle: { color: `${COLORS.sleep}18` },
          },
          {
            name: "HRV (ms)",
            data: hrv,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2, color: COLORS.hrv },
            itemStyle: { color: COLORS.hrv },
          },
          {
            name: "HR (bpm)",
            data: hr,
            type: "line",
            smooth: true,
            yAxisIndex: 1,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2, color: COLORS.hr },
            itemStyle: { color: COLORS.hr },
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
  }, [days, sleep, hrv, hr]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          Multi-Signal Trends
        </h3>
        <span className="text-xs text-muted-foreground">
          Rolling view across sleep, HRV, and heart rate
        </span>
      </div>
      <div ref={containerRef} className="h-72 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 2: Weekly Patterns (bar)
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
          Weekly Patterns
        </h3>
        <span className="text-xs text-muted-foreground">
          Average sleep by day of week
        </span>
      </div>
      <div ref={containerRef} className="h-52 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 3: Correlation Heatmap
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
      // Use real correlations if available, else identity matrix
      let corrData: number[][] = [];
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
          formatter: (params: any) => {
            const d = params.data;
            return `${metrics[d[0]]} × ${metrics[d[1]]}: ${d[2].toFixed(2)}`;
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
          Correlation Heatmap
        </h3>
        <span className="text-xs text-muted-foreground">
          How your signals relate to each other
        </span>
      </div>
      <div ref={containerRef} className="h-80 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 4: Baseline Ranges
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
        sleepM.p25 ?? sleepM.median ? (sleepM.median ?? 7.2) - 0.7 : 6.5,
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
            data: baselines.map((b, i) => highs[i] - lows[i]),
            itemStyle: {
              color: isDark
                ? "rgba(99, 102, 241, 0.35)"
                : "rgba(99, 102, 241, 0.2)",
              borderRadius: [0, 4, 4, 0],
            },
            label: {
              show: true,
              position: "inside",
              formatter: (params: any) =>
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
          Baseline Ranges
        </h3>
        <span className="text-xs text-muted-foreground">
          Your typical ranges based on historical data
        </span>
      </div>
      <div ref={containerRef} className="h-52 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 5: Volatility Bands
// ---------------------------------------------------------------------------

function VolatilityBandsChart({
  days,
  sleep,
}: Readonly<{ days: string[]; sleep: number[] }>) {
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

      // Compute ±1 SD band from data
      const mean = sleep.reduce((a, b) => a + b, 0) / (sleep.length || 1);
      const variance =
        sleep.reduce((a, b) => a + (b - mean) ** 2, 0) / (sleep.length || 1);
      const sd = Math.sqrt(variance);
      const upper = sleep.map((v) => +(v + sd).toFixed(1));
      const lower = sleep.map((v) => +(v - sd).toFixed(1));

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: TOOLTIP_BG,
          textStyle: { color: TOOLTIP_TEXT, fontSize: 12 },
        },
        legend: {
          data: ["Sleep", "±1 SD band"],
          textStyle: { color: axisLabelColor, fontSize: 11 },
          top: 0,
        },
        grid: { left: 40, right: 16, top: 36, bottom: 24 },
        xAxis: {
          type: "category",
          data: days,
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
            name: "±1 SD band",
            type: "line",
            data: upper,
            lineStyle: { opacity: 0 },
            symbol: "none",
            areaStyle: { color: `${COLORS.sleep}20` },
            stack: "band",
          },
          {
            name: "±1 SD band",
            type: "line",
            data: lower.map((v, i) => upper[i] - v),
            lineStyle: { opacity: 0 },
            symbol: "none",
            areaStyle: { color: `${COLORS.sleep}20` },
            stack: "band",
          },
          {
            name: "Sleep",
            type: "line",
            data: sleep,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2.5, color: COLORS.sleep },
            itemStyle: { color: COLORS.sleep },
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
  }, [days, sleep]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          Volatility Bands
        </h3>
        <span className="text-xs text-muted-foreground">
          Sleep duration with ±1 standard deviation band
        </span>
      </div>
      <div ref={containerRef} className="h-60 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual Trend Charts (existing style)
// ---------------------------------------------------------------------------

function TrendChart({
  title,
  data,
  unit,
  color,
}: Readonly<{
  title: string;
  data: number[];
  unit: string;
  color: string;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const days = data.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (data.length - 1 - i));
    return d.toLocaleDateString("en-IE", { month: "short", day: "numeric" });
  });

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
          borderColor: "rgba(148, 163, 184, 0.22)",
          borderWidth: 1,
          textStyle: {
            color: TOOLTIP_TEXT,
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
          },
          extraCssText:
            "box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); border-radius: 12px;",
        },
        grid: { left: 40, right: 16, top: 12, bottom: 24 },
        xAxis: {
          type: "category",
          data: days,
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisLine: { lineStyle: { color: "transparent" } },
          axisTick: { show: false, lineStyle: { color: axisLabelColor } },
        },
        yAxis: {
          type: "value",
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisTick: { show: false, lineStyle: { color: axisLabelColor } },
          splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
        },
        series: [
          {
            data,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 2.5,
              color,
              shadowBlur: 10,
              shadowColor: `${color}22`,
            },
            itemStyle: { color },
            emphasis: { focus: "series", lineStyle: { width: 3 } },
            areaStyle: { color: `${color}24` },
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
  }, [data, color, days]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div ref={containerRef} className="h-52 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyTrendsState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No trend data available yet. Upload an Apple Health export to populate
          your trends.
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proxy/users/portal-trends");
        if (res.ok) {
          setTrendsData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const extractValues = useCallback(
    (points: TrendPoint[]): number[] =>
      points.filter((p) => p.value != null).map((p) => p.value as number),
    []
  );

  const extractDates = useCallback(
    (points: TrendPoint[]): string[] =>
      points.filter((p) => p.value != null).map((p) => p.date),
    []
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!trendsData || trendsData.analysis_count === 0) {
    return <EmptyTrendsState />;
  }

  const { trends } = trendsData;
  const sleepVals = extractValues(trends.sleep);
  const hrvVals = extractValues(trends.hrv);
  const hrVals = extractValues(trends.hr);
  const stepVals = extractValues(trends.steps);
  const days = extractDates(trends.sleep);

  // Summary stats
  const avgSleep =
    sleepVals.length > 0
      ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1)
      : null;
  const avgHrv =
    hrvVals.length > 0
      ? Math.round(hrvVals.reduce((a, b) => a + b, 0) / hrvVals.length)
      : null;
  const avgHr =
    hrVals.length > 0
      ? Math.round(hrVals.reduce((a, b) => a + b, 0) / hrVals.length)
      : null;
  const avgSteps =
    stepVals.length > 0
      ? Math.round(stepVals.reduce((a, b) => a + b, 0) / stepVals.length)
      : null;

  // Compute sleep by weekday from available data
  const sleepByDay = WEEK_DAYS.map((_, i) => {
    const dayIdx = i === 6 ? 0 : i + 1; // JS Sunday=0
    const vals = sleepVals.filter((_, j) => {
      if (!days[j]) return false;
      // Parse year from date string if possible
      const parsed = new Date(days[j]);
      return !isNaN(parsed.getTime()) && parsed.getDay() === dayIdx;
    });
    return vals.length
      ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : 0;
  });

  // If no yearly data, try to use individual trend data from sections
  const hasYearlyData = sleepVals.length > 0;
  const activityVals = extractValues(trends.activity);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {avgSleep && (
          <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Avg Sleep
            </span>
            <p className="text-lg font-bold text-card-foreground">
              {avgSleep}h
            </p>
            <p className="text-[10px] text-muted-foreground">
              {sleepVals.length} data points
            </p>
          </div>
        )}
        {avgHrv != null && (
          <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Avg HRV
            </span>
            <p className="text-lg font-bold text-card-foreground">
              {avgHrv} ms
            </p>
            <p className="text-[10px] text-muted-foreground">
              {hrvVals.length} data points
            </p>
          </div>
        )}
        {avgHr != null && (
          <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Avg HR
            </span>
            <p className="text-lg font-bold text-card-foreground">
              {avgHr} bpm
            </p>
            <p className="text-[10px] text-muted-foreground">
              {hrVals.length} data points
            </p>
          </div>
        )}
        {avgSteps != null && (
          <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Avg Steps
            </span>
            <p className="text-lg font-bold text-card-foreground">
              {avgSteps.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stepVals.length} data points
            </p>
          </div>
        )}
      </div>

      {hasYearlyData && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">
            Signal Overview
          </h2>
          <MultiAxisTrendChart
            days={days}
            sleep={sleepVals}
            hrv={hrvVals}
            hr={hrVals}
          />
        </>
      )}

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">
        Patterns &amp; Baselines
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyPatternsChart sleepByDay={sleepByDay} />
        <BaselineRangesChart baseline={trends.baseline} />
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">
        Correlations
      </h2>

      <CorrelationHeatmapChart correlations={trends.correlations} />

      {sleepVals.length > 1 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">
            Volatility
          </h2>
          <VolatilityBandsChart days={days} sleep={sleepVals} />
        </>
      )}

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">
        Individual Signals
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {sleepVals.length > 0 && (
          <TrendChart
            title="Sleep Duration"
            data={sleepVals}
            unit="hours"
            color={COLORS.sleep}
          />
        )}
        {hrvVals.length > 0 && (
          <TrendChart
            title="Heart Rate Variability"
            data={hrvVals}
            unit="ms (rMSSD)"
            color={COLORS.hrv}
          />
        )}
      </div>

      {(activityVals.length > 0 || stepVals.length > 0) && (
        <TrendChart
          title={activityVals.length > 0 ? "Active Minutes" : "Daily Steps"}
          data={activityVals.length > 0 ? activityVals : stepVals}
          unit={activityVals.length > 0 ? "minutes / day" : "steps / day"}
          color={COLORS.activity}
        />
      )}
    </div>
  );
}
