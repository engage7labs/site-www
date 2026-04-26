"use client";

import { CompareImproveBlock } from "@/components/portal/compare-improve-block";
import { DailyBriefing } from "@/components/portal/daily-briefing";
import { ChartEmptyState } from "@/components/insights/chart-empty-state";
import { useLocale } from "@/components/providers/locale-provider";
import { generateCompareImprove } from "@/lib/insights/compare-improve";
import type { EChartsOption } from "echarts";
import { Clock, Crown, ExternalLink, Heart, Moon, Upload } from "lucide-react";
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
}

function MetricCard({ label, value, icon: Icon, subtitle }: MetricCardProps) {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
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
    </div>
  );
}

function ShareCard({ title, description, button }: Readonly<{ title: string; description: string; button: string }>) {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
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

// ---------------------------------------------------------------------------
// Overview Charts — ECharts (Sprint 17.4)
// ---------------------------------------------------------------------------

function SleepTrendMini({ data, title, emptyTitle, emptyMessage }: Readonly<{ data: TrendPoint[]; title: string; emptyTitle: string; emptyMessage: string }>) {
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

      const recent = data.slice(-14);
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
}: Readonly<{
  sleep: number | null;
  hr: number | null;
  hrv: number | null;
  steps: number | null;
  title: string;
  emptyTitle: string;
  emptyMessage: string;
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
  const [sections, setSections] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [overviewReq, trendsReq, analysesReq] = await Promise.allSettled([
          fetch("/api/proxy/users/portal-overview"),
          fetch("/api/proxy/users/portal-trends"),
          fetch("/api/proxy/users/portal-analyses"),
        ]);

        if (overviewReq.status === "fulfilled" && overviewReq.value.ok) {
          const overviewJson = (await overviewReq.value
            .json()
            .catch(() => null)) as OverviewData | null;
          setData(overviewJson);
        }

        if (trendsReq.status === "fulfilled" && trendsReq.value.ok) {
          const trendsJson = (await trendsReq.value
            .json()
            .catch(() => null)) as TrendsData | null;
          setTrends(trendsJson);
        }

        if (analysesReq.status === "fulfilled" && analysesReq.value.ok) {
          const analysesPayload = await analysesReq.value
            .json()
            .catch(() => null);
          setSections(parseLatestSections(analysesPayload));
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">{t.portal.loading}</p>
      </div>
    );
  }

  const plan = data?.plan ?? "trial";
  const uploads = data?.uploads ?? 0;
  const sleepScore = data?.sleep_score != null ? `${data.sleep_score}h` : "—";
  const recoveryTrend =
    data?.recovery_trend != null ? `${data.recovery_trend} ms` : "—";
  const completeness = data?.data_completeness ?? "—";
  const latest = data?.latest_analysis;
  const latestHighlights = coerceHighlights(latest?.highlights);

  return (
    <div className="flex flex-col gap-6">
      {/* Daily Briefing — Sprint 19.0 */}
      <DailyBriefing />

      {/* Compare & Improve — Sprint 17.5 */}
      <CompareImproveBlock result={compareImprove} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label={t.portal.metrics.plan}
          value={planLabel(plan, t.portal.planLabels)}
          icon={Crown}
          subtitle={
            data?.trial_end_at
              ? `${t.portal.metrics.until} ${new Date(data.trial_end_at).toLocaleDateString()}`
              : undefined
          }
        />
        <MetricCard
          label={t.portal.metrics.sleepScore}
          value={sleepScore}
          icon={Moon}
          subtitle={
            data?.sleep_score == null
              ? t.portal.metrics.noRecentData
              : t.portal.metrics.medianFromLatest
          }
        />
        <MetricCard
          label={t.portal.metrics.recovery}
          value={recoveryTrend}
          icon={Heart}
          subtitle={
            data?.recovery_trend == null
              ? t.portal.metrics.noRecentData
              : t.portal.metrics.medianHrvFromLatest
          }
        />
        <MetricCard
          label={t.portal.metrics.dataCompleteness}
          value={completeness}
          icon={Clock}
          subtitle={uploads > 0 ? t.portal.metrics.signalCoverage : t.portal.metrics.noUploads}
        />
        <MetricCard
          label={t.portal.metrics.uploads}
          value={String(uploads)}
          icon={Upload}
          subtitle={uploads > 0 ? t.portal.metrics.totalAnalyses : t.portal.metrics.startByUploading}
        />
      </div>

      <ShareCard
        title={t.portal.shareCard.title}
        description={t.portal.shareCard.description}
        button={t.portal.shareCard.button}
      />

      {/* ECharts — Sprint 17.4 / Sprint 25.9: always rendered, empty states when no data */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SleepTrendMini
          data={trends?.trends?.sleep ?? []}
          title={t.portal.sleepTrend}
          emptyTitle={t.portal.charts.sleepTrendEmpty.title}
          emptyMessage={t.portal.charts.sleepTrendEmpty.message}
        />
        <HealthRadar
          sleep={data?.sleep_score ?? null}
          hr={median(trends?.trends?.hr)}
          hrv={data?.recovery_trend ?? null}
          steps={median(trends?.trends?.steps)}
          title={t.portal.healthBalance}
          emptyTitle={t.portal.charts.healthBalanceEmpty.title}
          emptyMessage={t.portal.charts.healthBalanceEmpty.message}
        />
      </div>

      {latest ? (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t.portal.latestAnalysis.title}
          </h2>
          {latest.created_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(latest.created_at).toLocaleDateString("en-IE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {latestHighlights.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {latestHighlights.map((h: string, i: number) => (
                <li
                  key={`hl-${i}`}
                  className="flex items-start gap-2 text-sm text-card-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {t.portal.latestAnalysis.dataAvailable}
            </p>
          )}
          {latest.summary && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {!!latest.summary.dataset_start &&
                !!latest.summary.dataset_end && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-card-foreground">
                      {t.portal.latestAnalysis.period}:{" "}
                    </span>
                    {String(latest.summary.dataset_start)} →{" "}
                    {String(latest.summary.dataset_end)}
                  </div>
                )}
              {latest.summary.days != null && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-card-foreground">
                    {t.portal.latestAnalysis.days}:{" "}
                  </span>
                  {String(latest.summary.days)}
                </div>
              )}
              {latest.summary.total_rows != null && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-card-foreground">
                    {t.portal.latestAnalysis.records}:{" "}
                  </span>
                  {Number(latest.summary.total_rows).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t.portal.latestAnalysis.noDataTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.portal.latestAnalysis.noDataText}
          </p>
        </div>
      )}
    </div>
  );
}
