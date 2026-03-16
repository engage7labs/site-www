/**
 * ECharts Chart Configurations — Sprint 11
 *
 * Premium, calm chart options for the insight preview experience.
 * Uses the Engage7 brand palette. No raw/developer-style charts.
 *
 * Available data from API sections:
 *   weekly_patterns — 7 entries (Mon–Sun) with sleep_hours, hr_mean, hrv_sdnn_mean, total_steps
 *   monthly_patterns — 12 entries (Jan–Dec) with same fields
 *   baseline — period + metrics with median/mean/p25/p75/min/max
 */

import type { EChartsOption } from "echarts";

// Engage7 brand palette
const EMERALD = "#3dbe73";
const EMERALD_LIGHT = "rgba(61, 190, 115, 0.15)";
const EMERALD_MID = "rgba(61, 190, 115, 0.4)";
const GRAPHITE = "#1c1e20";
const MUTED = "#9aa0a6";
const TEAL = "#2ea8a0";
const TEAL_LIGHT = "rgba(46, 168, 160, 0.15)";
const AMBER = "#e5a336";
const AMBER_LIGHT = "rgba(229, 163, 54, 0.15)";

// Shared axis / grid styles for a premium, low-clutter look
const CLEAN_GRID = {
  left: "3%",
  right: "4%",
  bottom: "8%",
  top: "10%",
  containLabel: true,
};

const CLEAN_AXIS_LABEL = {
  color: MUTED,
  fontSize: 11,
  fontFamily: "Inter, sans-serif",
};

const SUBTLE_SPLIT_LINE = {
  lineStyle: { color: "rgba(200, 200, 200, 0.15)", type: "dashed" as const },
};

const CLEAN_TOOLTIP = {
  trigger: "axis" as const,
  backgroundColor: "rgba(26, 28, 31, 0.92)",
  borderColor: "transparent",
  textStyle: { color: "#e8eaed", fontSize: 12, fontFamily: "Inter, sans-serif" },
  padding: [8, 12],
};

// ---------------------------------------------------------------------------
// Sleep — weekly pattern line chart
// ---------------------------------------------------------------------------

interface WeeklyEntry {
  day_name: string;
  sleep_hours?: number;
  hr_mean?: number;
  hrv_sdnn_mean?: number;
  total_steps?: number;
}

export function buildSleepWeeklyChart(
  weekly: WeeklyEntry[],
  baselineMedian?: number | null,
  isDark = false
): EChartsOption {
  const labels = weekly.map((d) => d.day_name?.slice(0, 3) ?? "");
  const values = weekly.map((d) => d.sleep_hours ?? null);
  const axisLabelColor = isDark ? "#9aa0a6" : "#5f6368";

  return {
    grid: CLEAN_GRID,
    tooltip: { ...CLEAN_TOOLTIP },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "hours",
      nameTextStyle: { color: axisLabelColor, fontSize: 10, padding: [0, 0, 0, -30] },
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      splitLine: SUBTLE_SPLIT_LINE,
      min: (v: { min: number }) => Math.floor(v.min - 0.5),
      max: (v: { max: number }) => Math.ceil(v.max + 0.5),
    },
    series: [
      // Baseline mark line
      ...(baselineMedian != null
        ? [
            {
              type: "line" as const,
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { color: MUTED, type: "dashed" as const, width: 1 },
                label: {
                  formatter: `baseline: ${baselineMedian.toFixed(1)}h`,
                  color: MUTED,
                  fontSize: 10,
                },
                data: [{ yAxis: baselineMedian }],
              },
              data: [],
            },
          ]
        : []),
      // Area + line
      {
        type: "line" as const,
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: EMERALD, width: 2.5 },
        itemStyle: { color: EMERALD, borderWidth: 2, borderColor: isDark ? "#1a1c1f" : "#fff" },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: EMERALD_MID },
              { offset: 1, color: "rgba(61, 190, 115, 0.02)" },
            ],
          },
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Sleep — monthly pattern line chart (used as the primary hero chart)
// ---------------------------------------------------------------------------

interface MonthlyEntry {
  month_name: string;
  sleep_hours?: number;
  hr_mean?: number;
  hrv_sdnn_mean?: number;
  total_steps?: number;
}

export function buildSleepMonthlyChart(
  monthly: MonthlyEntry[],
  baselineMedian?: number | null,
  isDark = false
): EChartsOption {
  const labels = monthly.map((d) => d.month_name?.slice(0, 3) ?? "");
  const values = monthly.map((d) => d.sleep_hours ?? null);
  const axisLabelColor = isDark ? "#9aa0a6" : "#5f6368";

  return {
    grid: CLEAN_GRID,
    tooltip: { ...CLEAN_TOOLTIP },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "hours",
      nameTextStyle: { color: axisLabelColor, fontSize: 10, padding: [0, 0, 0, -30] },
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      splitLine: SUBTLE_SPLIT_LINE,
      min: (v: { min: number }) => Math.floor(v.min - 0.5),
      max: (v: { max: number }) => Math.ceil(v.max + 0.5),
    },
    series: [
      ...(baselineMedian != null
        ? [
            {
              type: "line" as const,
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { color: MUTED, type: "dashed" as const, width: 1 },
                label: {
                  formatter: `baseline: ${baselineMedian.toFixed(1)}h`,
                  color: MUTED,
                  fontSize: 10,
                },
                data: [{ yAxis: baselineMedian }],
              },
              data: [],
            },
          ]
        : []),
      {
        type: "line" as const,
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color: EMERALD, width: 2.5 },
        itemStyle: { color: EMERALD, borderWidth: 2, borderColor: isDark ? "#1a1c1f" : "#fff" },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: EMERALD_MID },
              { offset: 1, color: "rgba(61, 190, 115, 0.02)" },
            ],
          },
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Recovery — dual-signal (HR + HRV) weekly chart
// ---------------------------------------------------------------------------

export function buildRecoveryChart(
  weekly: WeeklyEntry[],
  isDark = false
): EChartsOption {
  const labels = weekly.map((d) => d.day_name?.slice(0, 3) ?? "");
  const hrValues = weekly.map((d) => d.hr_mean ?? null);
  const hrvValues = weekly.map((d) => d.hrv_sdnn_mean ?? null);
  const hasHrv = hrvValues.some((v) => v != null && v > 0);
  const axisLabelColor = isDark ? "#9aa0a6" : "#5f6368";

  return {
    grid: { ...CLEAN_GRID, right: hasHrv ? "12%" : "4%" },
    tooltip: { ...CLEAN_TOOLTIP },
    legend: {
      data: hasHrv ? ["Heart Rate", "HRV"] : ["Heart Rate"],
      bottom: 0,
      textStyle: { color: axisLabelColor, fontSize: 11 },
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 4,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "bpm",
        nameTextStyle: { color: axisLabelColor, fontSize: 10 },
        axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
        splitLine: SUBTLE_SPLIT_LINE,
      },
      ...(hasHrv
        ? [
            {
              type: "value" as const,
              name: "ms",
              nameTextStyle: { color: axisLabelColor, fontSize: 10 },
              axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
              splitLine: { show: false },
            },
          ]
        : []),
    ],
    series: [
      {
        name: "Heart Rate",
        type: "line" as const,
        data: hrValues,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color: TEAL, width: 2 },
        itemStyle: { color: TEAL, borderWidth: 2, borderColor: isDark ? "#1a1c1f" : "#fff" },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: TEAL_LIGHT },
              { offset: 1, color: "rgba(46, 168, 160, 0.02)" },
            ],
          },
        },
      },
      ...(hasHrv
        ? [
            {
              name: "HRV",
              type: "line" as const,
              yAxisIndex: 1,
              data: hrvValues,
              smooth: true,
              symbol: "circle",
              symbolSize: 5,
              lineStyle: { color: EMERALD, width: 2 },
              itemStyle: {
                color: EMERALD,
                borderWidth: 2,
                borderColor: isDark ? "#1a1c1f" : "#fff",
              },
              areaStyle: {
                color: {
                  type: "linear" as const,
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: EMERALD_LIGHT },
                    { offset: 1, color: "rgba(61, 190, 115, 0.02)" },
                  ],
                },
              },
            },
          ]
        : []),
    ],
  };
}

// ---------------------------------------------------------------------------
// Activity — monthly steps bar chart
// ---------------------------------------------------------------------------

export function buildActivityChart(
  monthly: MonthlyEntry[],
  isDark = false
): EChartsOption {
  const labels = monthly.map((d) => d.month_name?.slice(0, 3) ?? "");
  const values = monthly.map((d) => d.total_steps ?? null);
  const axisLabelColor = isDark ? "#9aa0a6" : "#5f6368";

  return {
    grid: CLEAN_GRID,
    tooltip: {
      ...CLEAN_TOOLTIP,
      formatter: (params: unknown) => {
        const p = Array.isArray(params) ? params[0] : params;
        const val = (p as { value?: number })?.value;
        if (val == null) return "";
        return `<b>${(p as { name?: string })?.name ?? ""}</b><br/>${val.toLocaleString()} steps`;
      },
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        ...CLEAN_AXIS_LABEL,
        color: axisLabelColor,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
      },
      splitLine: SUBTLE_SPLIT_LINE,
    },
    series: [
      {
        type: "bar" as const,
        data: values,
        barWidth: "50%",
        itemStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: AMBER },
              { offset: 1, color: AMBER_LIGHT },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Activity — weekly steps bar chart (for compact card)
// ---------------------------------------------------------------------------

export function buildActivityWeeklyChart(
  weekly: WeeklyEntry[],
  isDark = false
): EChartsOption {
  const labels = weekly.map((d) => d.day_name?.slice(0, 3) ?? "");
  const values = weekly.map((d) => d.total_steps ?? null);
  const axisLabelColor = isDark ? "#9aa0a6" : "#5f6368";

  return {
    grid: CLEAN_GRID,
    tooltip: {
      ...CLEAN_TOOLTIP,
      formatter: (params: unknown) => {
        const p = Array.isArray(params) ? params[0] : params;
        const val = (p as { value?: number })?.value;
        if (val == null) return "";
        return `<b>${(p as { name?: string })?.name ?? ""}</b><br/>${val.toLocaleString()} steps`;
      },
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...CLEAN_AXIS_LABEL, color: axisLabelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        ...CLEAN_AXIS_LABEL,
        color: axisLabelColor,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
      },
      splitLine: SUBTLE_SPLIT_LINE,
    },
    series: [
      {
        type: "bar" as const,
        data: values,
        barWidth: "50%",
        itemStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: AMBER },
              { offset: 1, color: AMBER_LIGHT },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}
