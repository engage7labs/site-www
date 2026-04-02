"use client";

import type { EChartsOption } from "echarts";
import { useEffect, useRef } from "react";

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

// Placeholder data — will be replaced with real API data
const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return d.toLocaleDateString("en-IE", { month: "short", day: "numeric" });
});

const SLEEP_HOURS = [
  7.2, 6.8, 7.5, 8.1, 6.9, 7.0, 7.4, 7.8, 6.5, 7.1, 7.6, 8.0, 7.3, 7.5,
];
const HRV = [42, 38, 45, 50, 35, 40, 44, 48, 33, 41, 46, 52, 43, 47];
const HR = [72, 75, 70, 68, 78, 74, 71, 69, 80, 73, 70, 67, 72, 71];
const STEPS = [
  8200, 6500, 9100, 12000, 5400, 10500, 7800, 9200, 11000, 6800, 9800, 8100,
  13000, 8500,
];
const ACTIVITY_MIN = [32, 45, 28, 60, 22, 50, 35, 42, 55, 30, 48, 38, 62, 44];

const LIGHT_TEXT = "#E5E7EB";
const TOOLTIP_TEXT = "#111827";
const TOOLTIP_BG = "#F9FAFB";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Metric colors from metric-colors.ts
const COLORS = {
  sleep: "#3dbe73",
  hr: "#e5a336",
  hrv: "#6366f1",
  steps: "#5eead4",
  activity: "#f59e0b",
};

function useChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  buildOption: (isDark: boolean) => EChartsOption
) {
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
      chart.setOption(buildOption(isDark));

      const observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    })();

    return () => {
      disposed = true;
      chart?.dispose();
    };
  }, [containerRef, buildOption]);
}

// ---------------------------------------------------------------------------
// Chart 1: Multi-Axis Trends
// ---------------------------------------------------------------------------

function MultiAxisTrendChart() {
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
          data: DAYS,
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
            data: SLEEP_HOURS,
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
            data: HRV,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2, color: COLORS.hrv },
            itemStyle: { color: COLORS.hrv },
          },
          {
            name: "HR (bpm)",
            data: HR,
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
  }, []);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          Multi-Signal Trends
        </h3>
        <span className="text-xs text-muted-foreground">
          14-day rolling view across sleep, HRV, and heart rate
        </span>
      </div>
      <div ref={containerRef} className="h-72 w-full" />
    </div>
  );
}

// Pre-compute average sleep by weekday from the 14-day window
const SLEEP_BY_DAY = WEEK_DAYS.map((_, i) => {
  const vals = SLEEP_HOURS.filter((_, j) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - j));
    return d.getDay() === (i === 6 ? 0 : i + 1);
  });
  return vals.length
    ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
    : 0;
});

// ---------------------------------------------------------------------------
// Chart 2: Weekly Patterns (bar)
// ---------------------------------------------------------------------------

function WeeklyPatternsChart() {
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

      // Average by weekday from the 14-day window
      const sleepByDay = SLEEP_BY_DAY;

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
  }, []);

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

function CorrelationHeatmapChart() {
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
      // Simulated correlation matrix
      const corrData = [
        [0, 0, 1.0],
        [0, 1, 0.65],
        [0, 2, -0.42],
        [0, 3, 0.28],
        [0, 4, 0.31],
        [1, 0, 0.65],
        [1, 1, 1.0],
        [1, 2, -0.58],
        [1, 3, 0.15],
        [1, 4, 0.22],
        [2, 0, -0.42],
        [2, 1, -0.58],
        [2, 2, 1.0],
        [2, 3, 0.35],
        [2, 4, 0.4],
        [3, 0, 0.28],
        [3, 1, 0.15],
        [3, 2, 0.35],
        [3, 3, 1.0],
        [3, 4, 0.82],
        [4, 0, 0.31],
        [4, 1, 0.22],
        [4, 2, 0.4],
        [4, 3, 0.82],
        [4, 4, 1.0],
      ];

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
  }, []);

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

function BaselineRangesChart() {
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

      const metrics = ["Sleep (h)", "HRV (ms)", "HR (bpm)", "Steps (k)"];
      const baselines = [7.2, 43, 72, 8.5];
      const lows = [6.5, 35, 65, 6.0];
      const highs = [8.0, 52, 80, 12.0];

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
  }, []);

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

function VolatilityBandsChart() {
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

      // Simulate volatility bands around sleep
      const upper = SLEEP_HOURS.map(
        (v) => +(v + 0.8 + Math.random() * 0.3).toFixed(1)
      );
      const lower = SLEEP_HOURS.map(
        (v) => +(v - 0.8 - Math.random() * 0.3).toFixed(1)
      );

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
          data: DAYS,
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
            data: SLEEP_HOURS,
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
  }, []);

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
          data: DAYS,
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
  }, [data, color]);

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
// Page
// ---------------------------------------------------------------------------

export default function TrendsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Multi-signal trends, correlations, baselines, and volatility
        </p>
      </div>

      {/* Multi-axis trend — full width */}
      <MultiAxisTrendChart />

      {/* Row: Weekly Patterns + Baseline Ranges */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyPatternsChart />
        <BaselineRangesChart />
      </div>

      {/* Correlation Heatmap — full width */}
      <CorrelationHeatmapChart />

      {/* Volatility Bands — full width */}
      <VolatilityBandsChart />

      {/* Individual line charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Sleep Duration"
          data={SLEEP_HOURS}
          unit="hours"
          color={COLORS.sleep}
        />
        <TrendChart
          title="Heart Rate Variability"
          data={HRV}
          unit="ms (rMSSD)"
          color={COLORS.hrv}
        />
      </div>

      <TrendChart
        title="Active Minutes"
        data={ACTIVITY_MIN}
        unit="minutes / day"
        color={COLORS.activity}
      />
    </div>
  );
}
