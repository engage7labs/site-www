"use client";

import {
  extractActivityInsights,
  extractActivitySignalInsights,
  extractRecoveryInsights,
  extractRecoverySignalInsights,
  extractSleepInsights,
  extractSleepStageInsights,
  type InsightText,
} from "@/lib/insights/extract";
import { CompareImproveBlock } from "@/components/portal/compare-improve-block";
import { generateCompareImprove } from "@/lib/insights/compare-improve";
import {
  getDarthPayload,
  getDarthPresentation,
  resolveDarthPresentationLocale,
  selectDarthCopy,
  selectDarthStatePresentation,
  type DarthInsightBlock,
  type DarthPayload,
  type DarthStatePresentation,
} from "@/lib/darth";
import type { PortalDataStatus } from "@/lib/portal-data-status";
import { parsePortalDataStatus } from "@/lib/portal-data-status";
import { useLocale } from "@/components/providers/locale-provider";
import {
  Activity,
  Heart,
  Lightbulb,
  Loader2,
  Minus,
  Moon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;
type SelectedDarthCopy = ReturnType<typeof selectDarthCopy>;

interface Analysis {
  sections?: Sections;
  sections_json?: unknown;
}

interface AnalysesPayload {
  analyses?: Analysis[];
  items?: Analysis[];
  portal_data_status?: unknown;
}

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
  };
  analysis_count: number;
}

const CONFIDENCE_COLORS = {
  high: "bg-accent/10 text-accent",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-muted text-muted-foreground",
};

const PILLAR_ICON: Record<string, React.ReactNode> = {
  sleep: <Moon className="h-3.5 w-3.5 text-[#3dbe73]" />,
  recovery: <Heart className="h-3.5 w-3.5 text-[#6366f1]" />,
  activity: <Activity className="h-3.5 w-3.5 text-[#f59e0b]" />,
};

const PILLAR_COLOR: Record<string, string> = {
  sleep: "#3dbe73",
  recovery: "#6366f1",
  activity: "#f59e0b",
};

function coerceSections(value: unknown): Sections | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Sections)
        : null;
    } catch {
      return null;
    }
  }

  return typeof value === "object" && !Array.isArray(value)
    ? (value as Sections)
    : null;
}

type OverviewData = Record<string, unknown>;

interface DarthDisplayBlock {
  block: DarthInsightBlock;
  copy: NonNullable<SelectedDarthCopy>;
}

function getAnalysisSections(analysis: Analysis | null | undefined): Sections | null {
  return coerceSections(analysis?.sections) ?? coerceSections(analysis?.sections_json);
}

function getAnalyses(payload: unknown): Analysis[] {
  if (Array.isArray(payload)) return payload as Analysis[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as AnalysesPayload;
  if (Array.isArray(record.analyses)) return record.analyses;
  if (Array.isArray(record.items)) return record.items;
  return [];
}

function humanizeTechnicalText(value: string | null | undefined): string | null {
  if (!value) return null;

  const replacements: Array<[RegExp, string]> = [
    [/\blast_7d\b/gi, "recent week"],
    [/\blast_30d\b/gi, "recent month"],
    [/\bbaseline_30d\b/gi, "usual range"],
    [/\bsleep[ _-]+variability[ _-]+cv\b/gi, "sleep regularity"],
    [/\bsleep_variability_cv\b/gi, "sleep regularity"],
    [/\bsteps[ _-]+variability[ _-]+cv\b/gi, "activity regularity"],
    [/\bsteps_variability_cv\b/gi, "activity regularity"],
    [/\bhrv_sdnn_mean\b/gi, "HRV"],
    [/\bhrv_sdnn\b/gi, "HRV"],
    [/\bhr_resting\b/gi, "resting heart rate"],
    [/\bresting_hr\b/gi, "resting heart rate"],
    [/\bhr_mean\b/gi, "resting heart rate"],
    [/\btotal_steps\b/gi, "daily steps"],
    [/\bactive_energy_cal\b/gi, "daily energy"],
    [/\btotal_energy_cal\b/gi, "daily energy"],
    [/\bsleep_hours\b/gi, "sleep duration"],
    [/\brecovery_composite_score\b/gi, "recovery pattern"],
    [/\bactivity_minutes\b/gi, "active minutes"],
  ];

  const cleaned = replacements
    .reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replace(/\s*\|\s*/g, " · ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

function hasRawTechnicalTrace(value: string | null | undefined): boolean {
  return Boolean(
    value &&
      (value.includes("|") ||
        /\b(last_7d|last_30d|baseline_30d|sleep[ _-]+variability[ _-]+cv|steps[ _-]+variability[ _-]+cv|sleep_variability_cv|steps_variability_cv|hrv_sdnn|hrv_sdnn_mean|hr_resting|resting_hr|hr_mean|total_steps|active_energy_cal|total_energy_cal|sleep_hours|recovery_composite_score)\b/i.test(
          value,
        ) ||
        /\b[a-z]+_[a-z0-9_]+\b/.test(value)),
  );
}

function safeDarthEvidence(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.includes("|")) return null;
  const mapped = humanizeTechnicalText(value);
  if (!mapped || hasRawTechnicalTrace(mapped)) return null;
  return mapped;
}

function cleanVisibleText(value: string | null | undefined): string | null {
  const mapped = humanizeTechnicalText(value);
  if (!mapped || hasRawTechnicalTrace(mapped)) return null;
  return mapped;
}

function isDarthDisplayBlock(
  entry: { block: DarthInsightBlock; copy: SelectedDarthCopy },
): entry is DarthDisplayBlock {
  return Boolean(entry.copy?.title && entry.copy?.body);
}

function extractLegacyInsights(sections: Sections | null): InsightText[] {
  const all = [
    ...extractSleepInsights(sections),
    ...extractSleepStageInsights(sections),
    ...extractRecoveryInsights(sections),
    ...extractRecoverySignalInsights(sections),
    ...extractActivityInsights(sections),
    ...extractActivitySignalInsights(sections),
  ];

  return all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function priorityToConfidence(p?: string): "high" | "medium" | "low" {
  if (p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
}

function trendFromScore(score?: number): "up" | "down" | "flat" {
  if (score == null) return "flat";
  if (score >= 60) return "up";
  if (score <= 30) return "down";
  return "flat";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-accent" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    case "flat":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

/** Compact SVG sparkline from trend data */
function Sparkline({
  values,
  color,
  width = 120,
  height = 32,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gradient fill below the line */}
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color})`}
      />
    </svg>
  );
}

function getSparklineData(
  pillar: string | undefined,
  trends: TrendsData["trends"] | null
): number[] {
  if (!trends || !pillar) return [];
  let points: TrendPoint[] = [];
  if (pillar === "sleep") points = trends.sleep;
  else if (pillar === "recovery")
    points = trends.hrv?.length > 0 ? trends.hrv : trends.hr;
  else if (pillar === "activity")
    points = trends.steps?.length > 0 ? trends.steps : trends.activity;
  return (points ?? [])
    .filter((p) => p.value != null)
    .map((p) => p.value as number)
    .slice(-30);
}

function InsightCard({
  insight,
  sparkData,
  strings,
}: {
  insight: InsightText;
  sparkData: number[];
  strings: {
    signals: { sleep: string; recovery: string; activity: string; default: string };
    lastDataPoints: string;
    confidence: { high: string; medium: string; low: string };
    confidenceExplanations: { high: string; medium: string; low: string };
    pillar: { sleep: string; recovery: string; activity: string };
    personalPattern: string;
    patternFromTimeline: string;
  };
}) {
  const confidence = priorityToConfidence(insight.priority);
  const trend = trendFromScore(insight.score);
  const color = PILLAR_COLOR[insight.pillar ?? "sleep"] ?? "#3dbe73";
  const icon = PILLAR_ICON[insight.pillar ?? "sleep"];
  const headline = cleanVisibleText(insight.headline) ?? strings.personalPattern;
  const body =
    cleanVisibleText(insight.body) ??
    strings.patternFromTimeline;
  const action = cleanVisibleText(insight.action);

  function getSignalLabel(pillar: string | undefined): string {
    if (pillar === "sleep") return strings.signals.sleep;
    if (pillar === "recovery") return strings.signals.recovery;
    if (pillar === "activity") return strings.signals.activity;
    return strings.signals.default;
  }

  function getPillarLabel(pillar: string | undefined): string {
    if (pillar === "sleep") return strings.pillar.sleep;
    if (pillar === "recovery") return strings.pillar.recovery;
    if (pillar === "activity") return strings.pillar.activity;
    return pillar ?? "";
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">
            {headline}
          </h3>
        </div>
        <TrendIcon trend={trend} />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action && (
        <p className="text-xs text-accent/80 italic">→ {action}</p>
      )}

      {/* Evidence sparkline */}
      {sparkData.length >= 2 && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
          <Sparkline values={sparkData} color={color} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {getSignalLabel(insight.pillar)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {strings.lastDataPoints.replace("{n}", String(sparkData.length))}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${CONFIDENCE_COLORS[confidence]}`}
          >
            {strings.confidence[confidence]}
          </span>
          {insight.pillar && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {icon}
              {getPillarLabel(insight.pillar)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {strings.confidenceExplanations[confidence]}
        </p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { t, locale } = useLocale();
  const [insights, setInsights] = useState<InsightText[]>([]);
  const [darthInsights, setDarthInsights] = useState<DarthDisplayBlock[]>([]);
  const [heroBlock, setHeroBlock] = useState<DarthDisplayBlock | null>(null);
  const [darthState, setDarthState] = useState<string | null>(null);
  const [darthClaim, setDarthClaim] = useState<string | null>(null);
  const [darthPayload, setDarthPayload] = useState<DarthPayload | null>(null);
  const [trends, setTrends] = useState<TrendsData["trends"] | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [latestSections, setLatestSections] = useState<Sections | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [usingLegacyFallback, setUsingLegacyFallback] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string>(
    t.portal.insightsPage.empty
  );
  const [portalStatus, setPortalStatus] = useState<PortalDataStatus | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/proxy/users/portal-analyses").then((r) => r.json()),
      fetch("/api/proxy/users/portal-trends")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/proxy/users/portal-overview")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([analysesData, trendPayload, overviewData]: [
        AnalysesPayload,
        TrendsData | null,
        OverviewData | null,
      ]) => {
        const status = parsePortalDataStatus(analysesData?.portal_data_status);
        setPortalStatus(status);
        setOverview(overviewData);

        // INSIGHTS_TRENDS_SPARKLINE_ONLY
        if (trendPayload?.trends) {
          setTrends(trendPayload.trends);
          setTrendsData(trendPayload);
        }

        // Insights
        const analyses: Analysis[] = getAnalyses(analysesData);
        if (analyses.length === 0) {
          setEmptyMessage(t.portal.insightsPage.empty);
          setEmpty(true);
          setLoading(false);
          return;
        }

        const latest =
          analyses.find((analysis) => getAnalysisSections(analysis)) ?? analyses[0];
        const sections = getAnalysisSections(latest);
        setLatestSections(sections);
        const presentation = getDarthPresentation(sections);
        const payload = getDarthPayload(sections);
        setDarthPayload(payload);
        setEmptyMessage(
          !payload || status?.darthStatus === "darth_missing"
            ? t.portal.insightsPage.empty
            : t.portal.insightsPage.empty
        );

        // Extract DARTH state + primary claim for header
        if (payload?.state) setDarthState(payload.state);
        if (payload?.primary_claim) {
          const stateDisplay = selectDarthStatePresentation(payload, locale);
          setDarthClaim(humanizeTechnicalText(stateDisplay?.primary_claim ?? payload.primary_claim));
        }

        // INSIGHTS_DARTH_PRESENTATION
        const darthLocale = resolveDarthPresentationLocale(presentation, locale);
        const hero = presentation?.hero
          ? {
              block: presentation.hero,
              copy: selectDarthCopy(presentation.hero.copy, darthLocale),
            }
          : null;
        const supporting = (presentation?.supporting ?? [])
          .map((block) => ({
            block,
            copy: selectDarthCopy(block.copy, darthLocale),
          }))
          .filter(isDarthDisplayBlock);

        if (hero && isDarthDisplayBlock(hero)) {
          setHeroBlock(hero);
          setDarthInsights(supporting);
          setInsights([]);
          setUsingLegacyFallback(false);
          setEmpty(false);
          setLoading(false);
          return;
        }

        // INSIGHTS_LEGACY_SECTIONS_FALLBACK
        const fallbackInsights = extractLegacyInsights(sections);
        if (fallbackInsights.length > 0) {
          setEmptyMessage(t.portal.insightsPage.legacyFallback);
        }
        setHeroBlock(null);
        setDarthInsights([]);
        setInsights(fallbackInsights);
        setUsingLegacyFallback(fallbackInsights.length > 0);
        setEmpty(fallbackInsights.length === 0);
        setLoading(false);
      })
      .catch(() => {
        setEmptyMessage(t.portal.insightsPage.loadError);
        setEmpty(true);
        setLoading(false);
      });
  }, [locale]);

  // Memoize sparkline data for each pillar
  const sparklines = useMemo(() => {
    return {
      sleep: getSparklineData("sleep", trends),
      recovery: getSparklineData("recovery", trends),
      activity: getSparklineData("activity", trends),
    };
  }, [trends]);

  const compareImprove = useMemo(
    () =>
      generateCompareImprove(
        overview,
        trendsData,
        latestSections,
        t.portal.compareImprove,
      ),
    [overview, trendsData, latestSections, t.portal.compareImprove],
  );
  const darthStateDisplay: DarthStatePresentation | null = useMemo(
    () => selectDarthStatePresentation(darthPayload, locale),
    [darthPayload, locale],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const insightStrings = {
    signals: t.portal.insightsPage.signals,
    lastDataPoints: t.portal.insightsPage.lastDataPoints,
    confidence: t.portal.insightsPage.confidence,
    confidenceExplanations: t.portal.insightsPage.confidenceExplanations,
    pillar: t.portal.insightsPage.pillar,
    personalPattern: t.portal.insightsPage.personalPattern,
    patternFromTimeline: t.portal.insightsPage.patternFromTimeline,
  };

  if (empty || (insights.length === 0 && darthInsights.length === 0 && !heroBlock)) {
    const message =
      !portalStatus?.hasAnalyses || portalStatus.analysisStatus === "no_analysis"
        ? t.portal.insightsPage.empty
        : portalStatus.darthStatus === "darth_missing"
          ? t.portal.insightsPage.empty
          : emptyMessage;

    return (
      <div className="flex flex-col gap-6">
        <CompareImproveBlock result={compareImprove} />
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground max-w-sm">
            {message}
          </p>
        </div>
      </div>
    );
  }

  // State label map
  const STATE_LABELS: Record<string, string> = {
    RECOVERING: "Recovering",
    STABLE: "Stable",
    STRAIN_ACCUMULATING: "Strain Accumulating",
    OVERREACHED: "Overreached",
    MISALIGNED_RECOVERY: "Misaligned Recovery",
  };

  return (
    <div className="flex flex-col gap-6">
      <CompareImproveBlock result={compareImprove} />

      {/* ─── DARTH primary claim header — Sprint 32.0 ─── */}
      {(darthState || darthClaim) && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-5 py-4 flex flex-col gap-2">
          {darthState && (
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {darthStateDisplay?.state_label ?? STATE_LABELS[darthState] ?? t.darthChrome.currentPattern}
            </span>
          )}
          {darthClaim && (
            <p className="text-sm font-medium text-card-foreground leading-relaxed">
              {cleanVisibleText(darthClaim) ?? t.portal.insightsPage.patternFromTimeline}
            </p>
          )}
        </div>
      )}

      {/* ─── DARTH hero insight ─── */}
      {heroBlock?.copy && (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-card p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {t.darthChrome.keyFinding}
            </span>
          </div>
          <h3 className="text-base font-semibold text-card-foreground leading-snug">
            {cleanVisibleText(heroBlock.copy.title) ?? t.portal.insightsPage.personalPatternDetected}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {cleanVisibleText(heroBlock.copy.body) ?? t.portal.insightsPage.patternFromTimeline}
          </p>
          {cleanVisibleText(heroBlock.copy.action) && (
            <p className="text-xs text-accent/80 italic">→ {cleanVisibleText(heroBlock.copy.action)}</p>
          )}
          {safeDarthEvidence(heroBlock.copy.evidence) && (
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {safeDarthEvidence(heroBlock.copy.evidence)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── Supporting insights ─── */}
      {darthInsights.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {darthInsights.map(({ block, copy }) =>
            copy ? (
              <div
                key={block.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {cleanVisibleText(copy.title) ?? t.portal.insightsPage.personalPattern}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {cleanVisibleText(copy.body) ?? t.portal.insightsPage.patternFromTimeline}
                </p>
                {cleanVisibleText(copy.action) && (
                  <p className="text-xs text-accent/80 italic">→ {cleanVisibleText(copy.action)}</p>
                )}
                {safeDarthEvidence(copy.evidence) && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {safeDarthEvidence(copy.evidence)}
                    </span>
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {usingLegacyFallback && (
            <div className="rounded-lg border border-border/70 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
              {t.portal.insightsPage.legacyFormatNotice}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.map((insight, i) => (
              <InsightCard
                key={`${insight.pillar}-${i}`}
                insight={insight}
                sparkData={
                  sparklines[insight.pillar as keyof typeof sparklines] ?? []
                }
                strings={insightStrings}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
