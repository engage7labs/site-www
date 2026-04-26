"use client";

import { DarthStatePanel } from "@/components/portal/darth-state-panel";
import type { EChartsOption } from "echarts";
import { Activity, Heart, Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic";

// Lazy-load echarts
async function getEcharts() {
  const echarts = await import("echarts/core");
  const { LineChart, BarChart } = await import("echarts/charts");
  const { GridComponent, TooltipComponent, LegendComponent } = await import(
    "echarts/components"
  );
  const { CanvasRenderer } = await import("echarts/renderers");
  echarts.use([
    LineChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    CanvasRenderer,
  ]);
  return echarts;
}

const LIGHT_TEXT = "#E5E7EB";
const TOOLTIP_TEXT = "#111827";
const TOOLTIP_BG = "#F9FAFB";

const COLORS = {
  sleep: "#3dbe73",
  hr: "#e5a336",
  hrv: "#6366f1",
  steps: "#5eead4",
  activity: "#f59e0b",
};

// ---------------------------------------------------------------------------
// Types
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

type Period = "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Last Week",
  month: "Last Month",
  year: "Last Year",
  all: "All Time",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterByPeriod(points: TrendPoint[], period: Period): TrendPoint[] {
  if (period === "all") return points;
  const now = new Date();
  const cutoff = new Date();
  if (period === "week") cutoff.setDate(now.getDate() - 7);
  else if (period === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (period === "year") cutoff.setFullYear(now.getFullYear() - 1);
  return points.filter((p) => new Date(p.date) >= cutoff);
}

function extractValues(points: TrendPoint[]): number[] {
  return points.filter((p) => p.value != null).map((p) => p.value as number);
}

function extractDates(points: TrendPoint[]): string[] {
  return points.filter((p) => p.value != null).map((p) => p.date);
}

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

// ---------------------------------------------------------------------------
// Period Switcher
// ---------------------------------------------------------------------------

function PeriodSwitcher({
  period,
  onChange,
}: Readonly<{ period: Period; onChange: (p: Period) => void }>) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted/40 p-0.5">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            period === p
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Longitudinal Chart
// ---------------------------------------------------------------------------

function LongitudinalChart({
  title,
  subtitle,
  dates,
  series,
}: Readonly<{
  title: string;
  subtitle: string;
  dates: string[];
  series: {
    name: string;
    data: number[];
    color: string;
    yAxisIndex?: number;
  }[];
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
        grid: { left: 50, right: hasSecondAxis ? 50 : 16, top: 36, bottom: 24 },
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
  }, [dates, series, title]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <div ref={containerRef} className="h-72 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Stat Card
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
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        No health data available yet. Upload an Apple Health export to populate
        your longitudinal view.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HealthPage() {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [latestSections, setLatestSections] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

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
          const latest = analyses.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any) => a.sections
          );
          if (latest?.sections) {
            setLatestSections(latest.sections);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!trendsData || trendsData.analysis_count === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState />
      </div>
    );
  }

  const { trends } = trendsData;

  // Apply period filter
  const sleepPts = filterByPeriod(trends.sleep, period);
  const hrvPts = filterByPeriod(trends.hrv, period);
  const hrPts = filterByPeriod(trends.hr, period);
  const stepsPts = filterByPeriod(trends.steps, period);
  const activityPts = filterByPeriod(trends.activity, period);

  const sleepVals = extractValues(sleepPts);
  const hrvVals = extractValues(hrvPts);
  const hrVals = extractValues(hrPts);
  const stepsVals = extractValues(stepsPts);
  const activityVals = extractValues(activityPts);

  const sleepDates = extractDates(sleepPts);
  const hrvDates = extractDates(hrvPts);
  const hrDates = extractDates(hrPts);
  const stepsDates = extractDates(stepsPts);
  const activityDates = extractDates(activityPts);

  const avgSleep = avg(sleepVals);
  const avgHrv = avg(hrvVals);
  const avgHr = avg(hrVals);
  const avgSteps = avg(stepsVals);
  const avgActivity = avg(activityVals);

  const hasSleep = sleepVals.length > 0;
  const hasRecovery = hrvVals.length > 0 || hrVals.length > 0;
  const hasActivity = activityVals.length > 0 || stepsVals.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PeriodSwitcher period={period} onChange={setPeriod} />
      </div>

      {/* ─── DARTH State Panel — Sprint 32.0 ─── */}
      <DarthStatePanel sections={latestSections} />

      {/* ─── Sleep Section ─── */}
      <div id="sleep" className="flex items-center gap-2 mt-2 scroll-mt-20">
        <Moon className="h-4 w-4 text-[#3dbe73]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sleep
        </h2>
      </div>

      {hasSleep ? (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Avg Duration"
              value={avgSleep!.toFixed(1)}
              unit="hours"
              count={sleepVals.length}
            />
            {sleepVals.length >= 2 && (
              <StatCard
                label="Min"
                value={Math.min(...sleepVals).toFixed(1)}
                unit="hours"
                count={sleepVals.length}
              />
            )}
            {sleepVals.length >= 2 && (
              <StatCard
                label="Max"
                value={Math.max(...sleepVals).toFixed(1)}
                unit="hours"
                count={sleepVals.length}
              />
            )}
            {sleepVals.length >= 3 && (
              <StatCard
                label="Consistency"
                value={Math.sqrt(
                  sleepVals.reduce((a, v) => a + (v - avgSleep!) ** 2, 0) /
                    sleepVals.length
                ).toFixed(2)}
                unit="σ"
                count={sleepVals.length}
              />
            )}
          </div>
          <LongitudinalChart
            title="Sleep Duration"
            subtitle="Nightly sleep hours over time"
            dates={sleepDates}
            series={[
              { name: "Sleep (h)", data: sleepVals, color: COLORS.sleep },
            ]}
          />
        </>
      ) : (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
          <Moon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            No sleep data for this period
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
            Sleep duration and quality metrics appear here once your Apple
            Health export includes sleep data. Try selecting a wider time range.
          </p>
        </div>
      )}

      {/* ─── Recovery Section ─── */}
      <div id="recovery" className="flex items-center gap-2 mt-2 scroll-mt-20">
        <Heart className="h-4 w-4 text-[#6366f1]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recovery
        </h2>
      </div>

      {hasRecovery ? (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
                label="Avg Resting HR"
                value={Math.round(avgHr).toString()}
                unit="bpm"
                count={hrVals.length}
              />
            )}
          </div>
          <LongitudinalChart
            title="HRV & Heart Rate"
            subtitle="Recovery markers over time"
            dates={hrvDates.length >= hrDates.length ? hrvDates : hrDates}
            series={[
              ...(hrvVals.length > 0
                ? [
                    {
                      name: "HRV (ms)",
                      data: hrvVals,
                      color: COLORS.hrv,
                    },
                  ]
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
        </>
      ) : (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
          <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            No recovery data for this period
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
            HRV and resting heart rate trends appear here when your export
            contains heart-related metrics. Try selecting a wider time range.
          </p>
        </div>
      )}

      {/* ─── Activity Section ─── */}
      <div id="activity" className="flex items-center gap-2 mt-2 scroll-mt-20">
        <Activity className="h-4 w-4 text-[#f59e0b]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </h2>
      </div>

      {hasActivity ? (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {avgActivity != null && (
              <StatCard
                label="Avg Active Minutes"
                value={Math.round(avgActivity).toString()}
                unit="min/day"
                count={activityVals.length}
              />
            )}
            {avgSteps != null && (
              <StatCard
                label="Avg Steps"
                value={Math.round(avgSteps).toLocaleString()}
                unit="steps/day"
                count={stepsVals.length}
              />
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {activityVals.length > 0 && (
              <LongitudinalChart
                title="Active Minutes"
                subtitle="Daily active minutes over time"
                dates={activityDates}
                series={[
                  {
                    name: "Active (min)",
                    data: activityVals,
                    color: COLORS.activity,
                  },
                ]}
              />
            )}
            {stepsVals.length > 0 && (
              <LongitudinalChart
                title="Daily Steps"
                subtitle="Step count over time"
                dates={stepsDates}
                series={[
                  {
                    name: "Steps",
                    data: stepsVals,
                    color: COLORS.steps,
                  },
                ]}
              />
            )}
          </div>
        </>
      ) : (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            No activity data for this period
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
            Steps and active minutes appear here once your export includes
            activity data. Try selecting a wider time range.
          </p>
        </div>
      )}
    </div>
  );
}
