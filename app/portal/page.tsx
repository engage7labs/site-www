"use client";

import { CompareImproveBlock } from "@/components/portal/compare-improve-block";
import { DailyBriefing } from "@/components/portal/daily-briefing";
import { ChartEmptyState } from "@/components/insights/chart-empty-state";
import { useLocale } from "@/components/providers/locale-provider";
import { generateCompareImprove } from "@/lib/insights/compare-improve";
import type { PortalDataStatus } from "@/lib/portal-data-status";
import { parsePortalDataStatus } from "@/lib/portal-data-status";
import type { EChartsOption } from "echarts";
import { ArrowDown, ArrowRight, ArrowUp, Clock, Crown, ExternalLink, Heart, Moon, Upload, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// Lazy-load echarts
async function getEcharts() {
  const echarts = await import("echarts/core");
  const { LineChart, BarChart, RadarChart } = await import("echarts/charts");
  const { GridComponent, TooltipComponent, LegendComponent, RadarComponent } =
    await import("echarts/components");
  const { CanvasRenderer } = await import("echarts/renderers");
  echarts.use([
    LineChart,
    BarChart,
    RadarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    RadarComponent,
    CanvasRenderer,
  ]);
  return echarts;
}

const COLORS = {
  sleep: "#3dbe73",
  hr: "#e5a336",
  hrv: "#6366f1",
  steps: "#5eead4",
};

const OVERVIEW_HEADER_EVENT = "engage7:overview-header-subtitle";

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
  };
  analysis_count: number;
  portal_data_status?: unknown;
}

interface HealthPoint {
  date: string;
  [key: string]: string | number | boolean | null;
}

interface HealthData {
  analysis_count: number;
  data_points: HealthPoint[];
  portal_data_status?: unknown;
}

interface OverviewData {
  plan: string;
  trial_end_at: string | null;
  uploads: number;
  sleep_score: number | null;
  recovery_trend: number | null;
  data_completeness: string | null;
  has_password?: boolean;
  latest_analysis: {
    job_id: string;
    created_at: string | null;
    report_label: string | null;
    summary: Record<string, unknown> | null;
    highlights: string[] | null;
  } | null;
  portal_data_status?: unknown;
}

interface StatusNoticeProps {
  readonly status: PortalDataStatus | null;
}

function StatusNotice({ status }: StatusNoticeProps) {
  if (!status) return null;

  let message: string | null = null;
  if (!status.hasAnalyses || status.analysisStatus === "no_analysis") {
    message = "No analysis has been created yet. Refresh your Apple Health timeline to start your Portal.";
  } else if (status.analysisStatus === "analysis_processing" || status.analysisStatus === "update_data_processing") {
    message = "Your latest analysis is still processing. Available Portal cards will update when it finishes.";
  } else if (status.analysisStatus === "analysis_failed" || status.analysisStatus === "update_data_failed") {
    message = "The latest analysis did not complete. Existing Portal data is still shown where available.";
  } else if (status.analysisStatus === "claim_import_in_progress") {
    message = "Your public analysis is being imported into your Portal.";
  } else if (!status.hasDarth) {
    message = "Analysis data is available, but the DARTH guidance layer is not ready for this analysis yet.";
  } else if (!status.hasFeatureTimeline) {
    message = "Analysis data is available, but the longitudinal feature timeline is not available for this account yet.";
  }

  if (!message) return null;

  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function coerceHighlights(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function parseLatestSections(payload: unknown): Record<string, unknown> | null {
  if (!payload) return null;

  let list: unknown[] = [];
  if (Array.isArray(payload)) {
    list = payload;
  } else {
    const maybeItems = (payload as { items?: unknown[] })?.items;
    if (Array.isArray(maybeItems)) {
      list = maybeItems;
    }
  }

  if (list.length === 0) return null;
  const latest = list[0] as { sections_json?: unknown };
  const raw = latest?.sections_json;
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return raw && typeof raw === "object"
    ? (raw as Record<string, unknown>)
    : null;
}

interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ElementType;
  readonly subtitle?: string;
  readonly debugLabel: string;
  readonly href?: string;
  readonly trend?: TrendSummary;
}

type TrendState = "up" | "down" | "stable" | "unavailable";

interface TrendSummary {
  readonly state: TrendState;
  readonly label: string;
}

function CardDebugLabel({ label }: Readonly<{ label: string }>) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {label}
    </div>
  );
}

function OverviewBlock({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-2">
      <CardDebugLabel label={label} />
      {children}
    </div>
  );
}

function TrendIndicator({ trend }: Readonly<{ trend?: TrendSummary }>) {
  if (!trend) return null;
  const Icon =
    trend.state === "up"
      ? ArrowUp
      : trend.state === "down"
        ? ArrowDown
        : ArrowRight;

  return (
    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{trend.label}</span>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, subtitle, debugLabel, href, trend }: MetricCardProps) {
  const content = (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
      <CardDebugLabel label={debugLabel} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-xl font-bold text-card-foreground">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
      <TrendIndicator trend={trend} />
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl">
      {content}
    </Link>
  );
}

function ShareCard({ title, description, button }: Readonly<{ title: string; description: string; button: string }>) {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
      <CardDebugLabel label="OVERVIEW_SHARE_CARD" />
      <div className="flex items-center gap-3">
        <ExternalLink className="h-5 w-5 text-accent" />
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <a
          href="https://www.engage7.ie"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {button}
        </a>
      </div>
    </div>
  );
}

function planLabel(plan: string, labels: { trialStart: string; trial: string; premium: string; expired: string }): string {
  if (plan === "trial_start") return labels.trialStart;
  if (plan === "trial") return labels.trial;
  if (plan === "premium") return labels.premium;
  if (plan === "expired") return labels.expired;
  return plan;
}

function median(points?: TrendPoint[]): number | null {
  if (!points) return null;
  const vals = points
    .map((p) => p.value)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid];
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function valueFor(point: HealthPoint, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(point[key]);
    if (value !== null) return value;
  }
  return null;
}

function healthTrend(points: HealthPoint[] | undefined, keys: string[]): TrendPoint[] {
  return [...(points ?? [])]
    .filter((point) => point.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => ({
      date: point.date,
      value: valueFor(point, keys),
    }));
}

function getDateKey(point: TrendPoint): string {
  return point.date.slice(0, 10);
}

function parseDateKey(value: string): Date | null {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDateKey(value: string, days: number): string | null {
  const date = parseDateKey(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

function latestFeatureDate(trendsData: TrendsData | null): string | null {
  const dates = Object.values(trendsData?.trends ?? {})
    .flat()
    .filter((point) => point.value != null)
    .map(getDateKey)
    .sort();
  return dates.at(-1) ?? null;
}

function availableRange(points: TrendPoint[] | undefined, latestDate: string | null) {
  if (!points || !latestDate) return null;
  const availableDates = points
    .filter((point) => point.value != null)
    .map(getDateKey)
    .sort();
  if (availableDates.length === 0) return null;

  const weekStart = shiftDateKey(latestDate, -6);
  if (!weekStart) return null;
  const firstAvailable = availableDates[0];
  return {
    start: firstAvailable > weekStart ? firstAvailable : weekStart,
    end: latestDate,
  };
}

function pointsInRange(points: TrendPoint[] | undefined, start: string | null, end: string | null): TrendPoint[] {
  if (!points || !start || !end) return [];
  return points.filter((point) => {
    const date = getDateKey(point);
    return date >= start && date <= end;
  });
}

function medianSubtitle(
  range: { start: string; end: string } | null,
  copy: { medianRange: string; medianLatestAvailable: string }
): string {
  if (!range) return copy.medianLatestAvailable;
  return copy.medianRange
    .replace("{start}", range.start)
    .replace("{end}", range.end);
}

function latestAnalysisSubtitle(latest: OverviewData["latest_analysis"] | null | undefined): string {
  if (!latest) return "No recent analysis yet. Update Data to refresh your Apple Health timeline.";
  if (!latest.created_at) return "Latest analysis available.";

  const formattedDate = new Date(latest.created_at).toLocaleDateString("en-IE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `Latest analysis available: ${formattedDate}`;
}

function weeklyTrend(
  points: TrendPoint[] | undefined,
  latestRange: { start: string; end: string } | null,
  copy: { up: string; down: string; stable: string; unavailable: string }
): TrendSummary {
  if (!points || !latestRange) return { state: "unavailable", label: copy.unavailable };
  const previousEnd = shiftDateKey(latestRange.start, -1);
  const previousStart = previousEnd ? shiftDateKey(previousEnd, -6) : null;
  const latestMedian = median(pointsInRange(points, latestRange.start, latestRange.end));
  const previousWindow = pointsInRange(points, previousStart, previousEnd);
  const previousMedian = median(previousWindow);

  if (latestMedian == null || previousMedian == null || previousWindow.filter((point) => point.value != null).length < 2) {
    return { state: "unavailable", label: copy.unavailable };
  }

  const relativeChange = previousMedian === 0
    ? Math.abs(latestMedian - previousMedian)
    : Math.abs((latestMedian - previousMedian) / previousMedian);
  if (relativeChange < 0.05) return { state: "stable", label: copy.stable };
  return latestMedian > previousMedian
    ? { state: "up", label: copy.up }
    : { state: "down", label: copy.down };
}

// ---------------------------------------------------------------------------
// Overview Charts — ECharts (Sprint 17.4)
// ---------------------------------------------------------------------------

function SleepTrendMini({
  data,
  title,
  emptyTitle,
  emptyMessage,
  debugLabel,
}: Readonly<{
  data: TrendPoint[];
  title: string;
  emptyTitle: string;
  emptyMessage: string;
  debugLabel: string;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasData = data.some((p) => p.value != null);

  useEffect(() => {
    if (!hasData) return; // empty state rendered in JSX

    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const axisColor = isDark ? "#E5E7EB" : "#5f6368";
      const splitColor = isDark
        ? "rgba(229,231,235,0.09)"
        : "rgba(148,163,184,0.18)";

      const recent = data.filter((p) => p.value != null).slice(-14);
      const days = recent.map((p) => p.date.slice(5));
      const values = recent.map((p) => p.value);

      const option: EChartsOption = {
        textStyle: { fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#F9FAFB",
          borderColor: "rgba(148,163,184,0.22)",
          borderWidth: 1,
          textStyle: { color: "#111827", fontSize: 12 },
        },
        grid: { left: 40, right: 16, top: 12, bottom: 24 },
        xAxis: {
          type: "category",
          data: days,
          axisLabel: { fontSize: 9, color: axisColor },
          axisLine: { lineStyle: { color: "transparent" } },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          name: "Hours",
          nameTextStyle: { color: axisColor, fontSize: 9 },
          axisLabel: { fontSize: 9, color: axisColor },
          splitLine: { lineStyle: { color: splitColor, type: "dashed" } },
        },
        series: [
          {
            data: values,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: { width: 2.5, color: COLORS.sleep },
            itemStyle: { color: COLORS.sleep },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${COLORS.sleep}30` },
                  { offset: 1, color: `${COLORS.sleep}05` },
                ],
              } as unknown as string,
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
  }, [data, hasData]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-5">
      <CardDebugLabel label={debugLabel} />
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        {title}
      </h3>
      {hasData ? (
        <div ref={containerRef} className="w-full h-[180px]" />
      ) : (
        <ChartEmptyState
          height={180}
          title={emptyTitle}
          message={emptyMessage}
        />
      )}
    </div>
  );
}

function HealthRadar({
  sleep,
  hr,
  hrv,
  steps,
  title,
  emptyTitle,
  emptyMessage,
  debugLabel,
}: Readonly<{
  sleep: number | null;
  hr: number | null;
  hrv: number | null;
  steps: number | null;
  title: string;
  emptyTitle: string;
  emptyMessage: string;
  debugLabel: string;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sleep == null && hr == null && hrv == null && steps == null) return;

    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const labelColor = isDark ? "#E5E7EB" : "#5f6368";

      // Normalize each value to a 0–100 scale for the radar
      const normalize = (v: number | null, min: number, max: number) => {
        if (v == null) return 0;
        return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
      };

      const sleepN = normalize(sleep, 4, 10);
      const hrN = 100 - normalize(hr, 45, 100); // lower HR is better
      const hrvN = normalize(hrv, 10, 100);
      const stepsN = normalize(steps, 0, 15000);

      const option: EChartsOption = {
        textStyle: { fontFamily: "Inter, sans-serif" },
        tooltip: {
          backgroundColor: "#F9FAFB",
          borderColor: "rgba(148,163,184,0.22)",
          borderWidth: 1,
          textStyle: { color: "#111827", fontSize: 12 },
        },
        radar: {
          indicator: [
            { name: `Sleep\n${sleep != null ? sleep + "h" : "—"}`, max: 100 },
            {
              name: `HR\n${hr != null ? Math.round(hr) + " bpm" : "—"}`,
              max: 100,
            },
            {
              name: `HRV\n${hrv != null ? Math.round(hrv) + " ms" : "—"}`,
              max: 100,
            },
            {
              name: `Steps\n${
                steps != null ? Math.round(steps).toLocaleString() : "—"
              }`,
              max: 100,
            },
          ],
          shape: "circle",
          axisName: { color: labelColor, fontSize: 10 },
          splitArea: {
            areaStyle: {
              color: isDark
                ? ["rgba(16,185,129,0.03)", "rgba(16,185,129,0.06)"]
                : ["rgba(61,190,115,0.03)", "rgba(61,190,115,0.06)"],
            },
          },
          splitLine: {
            lineStyle: {
              color: isDark
                ? "rgba(229,231,235,0.08)"
                : "rgba(148,163,184,0.15)",
            },
          },
          axisLine: {
            lineStyle: {
              color: isDark
                ? "rgba(229,231,235,0.08)"
                : "rgba(148,163,184,0.15)",
            },
          },
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: [sleepN, hrN, hrvN, stepsN],
                areaStyle: { color: `${COLORS.sleep}22` },
                lineStyle: { color: COLORS.sleep, width: 2 },
                itemStyle: { color: COLORS.sleep },
                symbol: "circle",
                symbolSize: 5,
              },
            ],
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
  }, [sleep, hr, hrv, steps]);

  const hasAnyValue = sleep != null || hr != null || hrv != null || steps != null;

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-5">
      <CardDebugLabel label={debugLabel} />
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        {title}
      </h3>
      {hasAnyValue ? (
        <div ref={containerRef} className="w-full h-[220px]" />
      ) : (
        <ChartEmptyState
          height={220}
          title={emptyTitle}
          message={emptyMessage}
        />
      )}
    </div>
  );
}

export default function PortalOverviewPage() {
  const { t } = useLocale();
  const [data, setData] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [sections, setSections] = useState<Record<string, unknown> | null>(
    null
  );
  const [portalStatus, setPortalStatus] = useState<PortalDataStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [overviewReq, trendsReq, analysesReq, healthReq] = await Promise.allSettled([
          fetch("/api/proxy/users/portal-overview"),
          fetch("/api/proxy/users/portal-trends"),
          fetch("/api/proxy/users/portal-analyses"),
          fetch("/api/proxy/users/portal-health-data"),
        ]);

        if (overviewReq.status === "fulfilled" && overviewReq.value.ok) {
          const overviewJson = (await overviewReq.value
            .json()
            .catch(() => null)) as OverviewData | null;
          setData(overviewJson);
          setPortalStatus(parsePortalDataStatus(overviewJson?.portal_data_status));
        }

        if (trendsReq.status === "fulfilled" && trendsReq.value.ok) {
          const trendsJson = (await trendsReq.value
            .json()
            .catch(() => null)) as TrendsData | null;
          setTrends(trendsJson);
          setPortalStatus((current) =>
            current ?? parsePortalDataStatus(trendsJson?.portal_data_status)
          );
        }

        if (analysesReq.status === "fulfilled" && analysesReq.value.ok) {
          const analysesPayload = await analysesReq.value
            .json()
            .catch(() => null);
          setSections(parseLatestSections(analysesPayload));
          setPortalStatus((current) =>
            current ?? parsePortalDataStatus(analysesPayload?.portal_data_status)
          );
        }

        if (healthReq.status === "fulfilled" && healthReq.value.ok) {
          const healthJson = (await healthReq.value
            .json()
            .catch(() => null)) as HealthData | null;
          setHealthData(healthJson);
          setPortalStatus((current) =>
            current ?? parsePortalDataStatus(healthJson?.portal_data_status)
          );
        }
      } catch {
        // silent — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const compareImprove = useMemo(
    () => generateCompareImprove(data, trends, sections),
    [data, trends, sections]
  );

  useEffect(() => {
    if (loading) return;
    window.dispatchEvent(
      new CustomEvent(OVERVIEW_HEADER_EVENT, {
        detail: { subtitle: latestAnalysisSubtitle(data?.latest_analysis) },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent(OVERVIEW_HEADER_EVENT, { detail: { subtitle: null } })
      );
    };
  }, [data?.latest_analysis, loading]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">{t.portal.loading}</p>
      </div>
    );
  }

  const plan = data?.plan ?? "trial";
  const uploads = data?.uploads ?? 0;
  const healthSleepTrend = healthTrend(healthData?.data_points, ["sleep_hours"]);
  const sleepPoints = healthSleepTrend.some((point) => point.value != null)
    ? healthSleepTrend
    : trends?.trends?.sleep;
  const sleepMedian = median(sleepPoints);
  const sleepScore =
    sleepMedian != null
      ? `${Number(sleepMedian.toFixed(1))}h`
      : data?.sleep_score != null
        ? `${data.sleep_score}h`
        : "—";
  const recoveryTrend =
    data?.recovery_trend != null ? `${data.recovery_trend} ms` : "—";
  const healthStepsTrend = healthTrend(healthData?.data_points, ["total_steps", "steps"]);
  const activityPoints = healthStepsTrend.some((point) => point.value != null)
    ? healthStepsTrend
    : trends?.trends?.steps;
  const stepsMedian = median(activityPoints);
  const activity = stepsMedian != null ? Math.round(stepsMedian).toLocaleString() : "—";
  const completeness = data?.data_completeness ?? "—";
  const featureLatestDate = latestFeatureDate({
    trends: {
      sleep: sleepPoints ?? [],
      hrv: trends?.trends?.hrv ?? [],
      hr: trends?.trends?.hr ?? [],
      steps: activityPoints ?? [],
    },
    analysis_count: trends?.analysis_count ?? healthData?.analysis_count ?? 0,
  });
  const sleepRange = availableRange(sleepPoints, featureLatestDate);
  const recoveryRange = availableRange(trends?.trends?.hrv, featureLatestDate);
  const activityRange = availableRange(activityPoints, featureLatestDate);
  const sleepTrend = weeklyTrend(sleepPoints, sleepRange, t.portal.metrics.weekTrend);
  const recoveryWeekTrend = weeklyTrend(trends?.trends?.hrv, recoveryRange, t.portal.metrics.weekTrend);
  const activityTrend = weeklyTrend(activityPoints, activityRange, t.portal.metrics.weekTrend);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label={t.portal.metrics.sleepScore}
          value={sleepScore}
          icon={Moon}
          debugLabel="OVERVIEW_SLEEP_CARD"
          href="/portal/health/sleep"
          subtitle={
            sleepMedian == null && data?.sleep_score == null
              ? t.portal.metrics.noRecentData
              : medianSubtitle(sleepRange, t.portal.metrics)
          }
          trend={sleepTrend}
        />
        <MetricCard
          label={t.portal.metrics.recovery}
          value={recoveryTrend}
          icon={Heart}
          debugLabel="OVERVIEW_RECOVERY_CARD"
          href="/portal/health/recovery"
          subtitle={
            data?.recovery_trend == null
              ? t.portal.metrics.noRecentData
              : medianSubtitle(recoveryRange, t.portal.metrics)
          }
          trend={recoveryWeekTrend}
        />
        <MetricCard
          label={t.portal.metrics.activity}
          value={activity}
          icon={Zap}
          debugLabel="OVERVIEW_ACTIVITY_CARD"
          href="/portal/health/activity"
          subtitle={
            stepsMedian == null
              ? t.portal.metrics.noRecentData
              : medianSubtitle(activityRange, t.portal.metrics)
          }
          trend={activityTrend}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label={t.portal.metrics.plan}
          value={planLabel(plan, t.portal.planLabels)}
          icon={Crown}
          debugLabel="OVERVIEW_PLAN_CARD"
          subtitle={
            data?.trial_end_at
              ? `${t.portal.metrics.until} ${new Date(data.trial_end_at).toLocaleDateString()}`
              : undefined
          }
        />
        <MetricCard
          label={t.portal.metrics.dataCompleteness}
          value={completeness}
          icon={Clock}
          debugLabel="OVERVIEW_DATA_COMPLETENESS_CARD"
          subtitle={uploads > 0 ? t.portal.metrics.signalCoverage : t.portal.metrics.noUploads}
        />
        <MetricCard
          label={t.portal.metrics.uploads}
          value={String(uploads)}
          icon={Upload}
          debugLabel="OVERVIEW_SUBMISSIONS_CARD"
          subtitle={uploads > 0 ? t.portal.metrics.totalAnalyses : t.portal.metrics.startByUploading}
        />
      </div>

      <OverviewBlock label="OVERVIEW_DAILY_BRIEFING_COMPONENT">
        <DailyBriefing />
      </OverviewBlock>

      <OverviewBlock label="OVERVIEW_STATUS_NOTICE_COMPONENT">
        <StatusNotice status={portalStatus} />
      </OverviewBlock>

      <OverviewBlock label="OVERVIEW_COMPARE_IMPROVE_COMPONENT">
        <CompareImproveBlock result={compareImprove} />
      </OverviewBlock>

      {/* ECharts — Sprint 17.4 / Sprint 25.9: always rendered, empty states when no data */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SleepTrendMini
          data={sleepPoints ?? []}
          title={t.portal.sleepTrend}
          emptyTitle={t.portal.charts.sleepTrendEmpty.title}
          emptyMessage={t.portal.charts.sleepTrendEmpty.message}
          debugLabel="OVERVIEW_SLEEP_TREND_CHART"
        />
        <HealthRadar
          sleep={data?.sleep_score ?? null}
          hr={median(trends?.trends?.hr)}
          hrv={data?.recovery_trend ?? null}
          steps={median(activityPoints)}
          title={t.portal.healthBalance}
          emptyTitle={t.portal.charts.healthBalanceEmpty.title}
          emptyMessage={t.portal.charts.healthBalanceEmpty.message}
          debugLabel="OVERVIEW_HEALTH_BALANCE_CHART"
        />
      </div>

      <ShareCard
        title={t.portal.shareCard.title}
        description={t.portal.shareCard.description}
        button={t.portal.shareCard.button}
      />
    </div>
  );
}
