/**
 * InsightPreview — Sprint 11
 *
 * The first product-quality visual insight experience.
 *
 * Desktop: two-column hero (sleep text + chart) with compact
 *          recovery + activity cards below — minimal scroll.
 * Mobile:  stacked cards (sleep → recovery → activity).
 *
 * Narrative order: Sleep → Recovery → Activity / Mobility.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import {
  buildActivityChart,
  buildActivityWeeklyChart,
  buildRecoveryChart,
  buildSleepMonthlyChart,
  buildSleepWeeklyChart,
} from "@/lib/charts";
import { formatDatasetDuration, type DurationInfo } from "@/lib/formatting";
import {
  extractActivityInsights,
  extractActivitySignalInsights,
  extractRecoveryInsights,
  extractRecoverySignalInsights,
  extractSleepInsights,
  extractSleepStageInsights,
  getPreviewInsight,
  getSurprisingInsight,
} from "@/lib/insights";
import { generateInsights } from "@/lib/insights/engine";
import {
  trackActivityPreviewViewed,
  trackAnalysisPreviewLoaded,
  trackChartInteracted,
  trackFullReportCtaViewed,
  trackPreviewNextClicked,
  trackReportUnlockClicked,
  trackSleepPreviewViewed,
} from "@/lib/telemetry";
import type { AnalysisResult } from "@/lib/types/analysis";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Crown,
  Footprints,
  HeartPulse,
  Moon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartEmptyState } from "./chart-empty-state";
import { DailyEnergyChart } from "./daily-energy-chart";
import { EChart } from "./echart";
import { InsightCard } from "./insight-card";
import { RecoveryScoreChart } from "./recovery-score-chart";
import { SleepStageChart } from "./sleep-stage-chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightPreviewProps {
  result: AnalysisResult;
  jobId: string;
  /** Current theme: "light" or "black" (product names) */
  theme?: string;
  /** Opens the post-analysis modal */
  onOpenModal?: () => void;
  /** When true, omit the standalone page shell (header + min-h-screen wrapper) */
  embedded?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;
type InsightSection = "recovery" | "activity";

const SECTION_TARGET_IDS: Record<InsightSection, string[]> = {
  recovery: ["recovery-desktop", "recovery-mobile"],
  activity: ["activity-desktop", "activity-mobile"],
};

function getVisibleSectionTarget(section: InsightSection): HTMLElement | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const candidates = SECTION_TARGET_IDS[section]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  const visible = candidates.find(
    (el) => window.getComputedStyle(el).display !== "none"
  );

  return visible ?? candidates[0] ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDarkMode(theme?: string) {
  // simple: "black" maps to dark
  return theme === "black";
}

// ---------------------------------------------------------------------------
// Locale helpers (Sprint 25.2)
// ---------------------------------------------------------------------------

function translatePillar(pillar: string, locale: string): string {
  if (locale === "pt-BR") {
    const map: Record<string, string> = {
      sleep: "sono",
      recovery: "prontidão",
      activity: "atividade",
    };
    return map[pillar] ?? pillar;
  }
  return pillar;
}

/**
 * Returns a locale-aware period string for chart headers.
 * Charts show full-dataset averages — use "historical average" label.
 */
function chartPeriodSuffix(
  _days: number | null | undefined,
  locale: string
): string {
  const isPt = locale === "pt-BR";
  return isPt ? "média histórica" : "historical average";
}

function sleepStageLabel(
  days: number | null | undefined,
  locale: string
): string {
  const isPt = locale === "pt-BR";
  const period = chartPeriodSuffix(days, locale);
  return isPt
    ? `Estágios do sono — média por noite (${period})`
    : `Sleep stages — avg per night (${period})`;
}

function recoveryLabel(
  days: number | null | undefined,
  locale: string
): string {
  const isPt = locale === "pt-BR";
  const period = chartPeriodSuffix(days, locale);
  return isPt
    ? `Prontidão — tendência (${period})`
    : `Readiness — trend (${period})`;
}

function energyLabel(days: number | null | undefined, locale: string): string {
  const isPt = locale === "pt-BR";
  const period = chartPeriodSuffix(days, locale);
  return isPt
    ? `Energia diária — média kcal (${period})`
    : `Daily energy — avg kcal (${period})`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsightPreview({
  result,
  jobId,
  theme,
  onOpenModal,
  embedded,
}: Readonly<InsightPreviewProps>) {
  const { t, locale } = useLocale();
  const isDark = useDarkMode(theme);
  const sections: Sections | null = result.sections ?? null;
  const summary = result.summary;

  // ---- Duration ---------------------------------------------------------
  const durationInfo: DurationInfo | null = useMemo(
    () => formatDatasetDuration(summary?.days ?? null),
    [summary?.days]
  );

  // Adaptive headline — based on sleep consistency (Sprint 24.0.1)
  const adaptiveHeadline = useMemo((): string => {
    const cv = sections?.volatility?.sleep_hours?.cv;
    const cvNum = cv != null ? Number(cv) : null;
    if (cvNum == null || isNaN(cvNum)) {
      return "Your body is showing clear patterns — here's what stands out";
    }
    if (cvNum < 20) {
      return "Your sleep is steady — your body is maintaining a stable rhythm";
    }
    return "Your patterns are shifting — your body is adapting";
  }, [sections]);

  // ---- Extract insights (deterministic) ----------------------------------
  const sleepInsights = useMemo(
    () => extractSleepInsights(sections),
    [sections]
  );
  const recoveryInsights = useMemo(
    () => extractRecoveryInsights(sections),
    [sections]
  );
  const activityInsights = useMemo(
    () => extractActivityInsights(sections),
    [sections]
  );

  // ---- Sprint 24.3: New signal insights from expanded sections ----------
  const sleepStageInsights = useMemo(
    () => extractSleepStageInsights(sections),
    [sections]
  );
  const recoverySignalInsights = useMemo(
    () => extractRecoverySignalInsights(sections),
    [sections]
  );
  const activitySignalInsights = useMemo(
    () => extractActivitySignalInsights(sections),
    [sections]
  );

  // Combined new insights — max 4, highest score first
  const newSignalInsights = useMemo(() => {
    const all = [
      ...sleepStageInsights,
      ...recoverySignalInsights,
      ...activitySignalInsights,
    ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return all.slice(0, 4);
  }, [sleepStageInsights, recoverySignalInsights, activitySignalInsights]);

  // ---- Sprint 25.0: Deterministic Insight Engine ---------------------------
  const engineInsights = useMemo(() => generateInsights(result), [result]);

  // ---- Preview insight for Premium CTA (Sprint 17.6.2) ------------------
  const previewInsight = useMemo(() => getPreviewInsight(sections), [sections]);

  // ---- Surprising personal insight (Sprint 19.0) ------------------------
  const surprisingInsight = useMemo(
    () => getSurprisingInsight(sections),
    [sections]
  );

  // ---- Chart configs -----------------------------------------------------
  const monthly = sections?.monthly_patterns;
  const weekly = sections?.weekly_patterns;
  const sleepBaseline =
    sections?.baseline?.metrics?.sleep_hours?.median ?? null;

  const sleepChartOption = useMemo(() => {
    if (Array.isArray(monthly) && monthly.length > 0) {
      return buildSleepMonthlyChart(monthly, sleepBaseline, isDark);
    }
    if (Array.isArray(weekly) && weekly.length > 0) {
      return buildSleepWeeklyChart(weekly, sleepBaseline, isDark);
    }
    return null;
  }, [monthly, weekly, sleepBaseline, isDark]);

  const recoveryChartOption = useMemo(() => {
    if (Array.isArray(weekly) && weekly.length > 0) {
      return buildRecoveryChart(weekly, isDark);
    }
    return null;
  }, [weekly, isDark]);

  const activityChartOption = useMemo(() => {
    if (Array.isArray(monthly) && monthly.length > 0) {
      return buildActivityChart(monthly, isDark);
    }
    if (Array.isArray(weekly) && weekly.length > 0) {
      return buildActivityWeeklyChart(weekly, isDark);
    }
    return null;
  }, [monthly, weekly, isDark]);

  // ---- Telemetry: fire on mount -----------------------------------------
  const telFired = useRef(false);
  useEffect(() => {
    if (telFired.current) return;
    telFired.current = true;
    const meta = {
      jobId,
      datasetDurationUnit: durationInfo?.unit,
      datasetDurationValue: durationInfo?.value,
      previewStage: "sleep",
    };
    trackAnalysisPreviewLoaded(meta);
    trackSleepPreviewViewed(meta);
  }, [jobId, durationInfo]);

  // ---- Progressive section reveal (Sprint 24.0) -------------------------
  const [sleepVisible, setSleepVisible] = useState(false);
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  const [activityVisible, setActivityVisible] = useState(false);

  useEffect(() => {
    setSleepVisible(true);
    const t2 = setTimeout(() => setRecoveryVisible(true), 150);
    const t3 = setTimeout(() => setActivityVisible(true), 300);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // ---- Expanded state for mobile cards -----------------------------------
  const [activeStage, setActiveStage] = useState<
    "sleep" | "recovery" | "activity"
  >("sleep");

  const scrollToSection = useCallback((section: InsightSection) => {
    const target = getVisibleSectionTarget(section);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = section;
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hashValue = window.location.hash.replace("#", "");
    if (hashValue === "recovery" || hashValue === "activity") {
      setActiveStage(hashValue);
      requestAnimationFrame(() => scrollToSection(hashValue));
    }
  }, [scrollToSection]);

  const goToActivity = () => {
    setActiveStage("activity");
    trackPreviewNextClicked("recovery", "recovery");
    trackActivityPreviewViewed({
      jobId,
      datasetDurationUnit: durationInfo?.unit,
      datasetDurationValue: durationInfo?.value,
      previewStage: "activity",
    });
    scrollToSection("activity");
  };

  const handleChartInteraction = (insightType: string) => {
    trackChartInteracted(insightType, activeStage);
  };

  // ---- Full report CTA --------------------------------------------------
  const fullReportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fullReportRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackFullReportCtaViewed("bottom");
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(fullReportRef.current);
    return () => obs.disconnect();
  }, []);

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {/* Header bar — hidden when embedded in portal */}
      {!embedded && (
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.result.preview.backToHome}
            </Link>
            <span className="text-xs text-muted-foreground">
              {t.result.preview.subtitle}
            </span>
          </div>
        </header>
      )}

      <main className={embedded ? "" : "max-w-6xl mx-auto px-6 pt-8 pb-16"}>
        {/* Sprint 25.5: 1. HERO HEADLINE — adaptive headline extracted from legacy hero */}
        <div className="text-[10px] uppercase opacity-60 mb-1">SPRINT25.5: heroHeadline</div>
        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-6">
          {adaptiveHeadline}
        </h1>

        {/* 2. Surprising personal insight */}
        {surprisingInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 mx-auto max-w-2xl rounded-xl border border-accent/20 bg-accent/[0.04] px-5 py-4 text-center"
          >
            <div className="text-[10px] uppercase opacity-60 mb-1">NEW: surprisingInsight</div>
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent/80">
                {t.result.preview.dataReveals}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {surprisingInsight}
            </p>
          </motion.div>
        )}

        {/* 2. Provenance card (gold) */}
        {(durationInfo || summary?.dataset_start) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-[#e6b800] bg-[#e6b800]/5 p-4 mb-6 flex flex-col gap-1"
          >
            <div className="text-[10px] uppercase opacity-60">NEW: dataProvenance</div>
            <div className="flex-1 min-w-0">
              {/* Sprint 25.5: Option A provenance text */}
              <p className="text-sm font-bold text-foreground">
                Built from{" "}
                <span className="text-[#e6b800]">7 years</span>{" "}
                of your real-life data
              </p>
              {summary?.dataset_start && summary?.dataset_end && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {String(summary.dataset_start)} →{" "}
                  {String(summary.dataset_end)}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. Engine insights */}
        {engineInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <div className="text-[10px] uppercase opacity-60 mb-1">NEW: engineInsights</div>
            {/* Hero — highest-scoring insight */}
            {(() => {
              const hero = engineInsights[0];
              const isHrv = hero.metrics_used.includes("hrv_sdnn_mean_median");
              return (
                <div
                  className={`rounded-xl border p-5 mb-3 ${
                    hero.severity === "critical"
                      ? "border-destructive/40 bg-destructive/[0.06]"
                      : "border-accent/30 bg-accent/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                        hero.severity === "critical"
                          ? "bg-destructive"
                          : "bg-accent"
                      }`}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {translatePillar(hero.pillar, locale)}
                    </span>
                  </div>
                  <p className="text-base font-bold text-foreground leading-snug mb-1.5">
                    {hero.action}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">
                    {hero.insight}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 font-mono leading-relaxed">
                    {hero.evidence}
                  </p>
                  {isHrv && (
                    <p className="text-[10px] text-muted-foreground/50 italic mt-2 leading-relaxed">
                      {locale === "pt-BR"
                        ? "VFC: indica como seu corpo está se recuperando. Valores mais altos geralmente significam melhor recuperação."
                        : "HRV: reflects how well your body is recovering. Higher values generally mean better recovery."}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/40 mt-3 pt-3 border-t border-border/20">
                    {locale === "pt-BR"
                      ? "Baseado nos seus padrões recentes"
                      : "This is based on your recent patterns"}
                  </p>
                </div>
              );
            })()}

            {/* Secondary grid — remaining insights */}
            {engineInsights.length > 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {engineInsights.slice(1).map((ins) => {
                  const isHrv = ins.metrics_used.includes(
                    "hrv_sdnn_mean_median"
                  );
                  return (
                    <div
                      key={ins.id}
                      className={`rounded-xl border p-4 ${
                        ins.severity === "critical"
                          ? "border-destructive/30 bg-destructive/[0.04]"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                            ins.severity === "critical"
                              ? "bg-destructive"
                              : "bg-accent"
                          }`}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {translatePillar(ins.pillar, locale)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug mb-1">
                        {ins.action}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {ins.insight}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono leading-relaxed">
                        {ins.evidence}
                      </p>
                      {isHrv && (
                        <p className="text-[10px] text-muted-foreground/50 italic mt-1.5 leading-relaxed">
                          {locale === "pt-BR"
                            ? "VFC: indica como seu corpo está se recuperando. Valores mais altos geralmente significam melhor recuperação."
                            : "HRV: reflects how well your body is recovering. Higher values generally mean better recovery."}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* 4. New signals block — Sprint 25.9: always rendered; empty state when data absent */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="text-[10px] uppercase opacity-60 mb-1">NEW: hasNewSignals</div>

          {/* Charts with narrative roles — Evidence → Impact → Possible cause */}
          {/* Sprint 25.9: all 3 slots always render; ChartEmptyState when data is absent */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Sleep Stages — Evidence */}
            {(() => {
              const stageData = sections?.sleep_stages;
              const hasStages =
                stageData?.has_stage_data === true &&
                ((stageData.averages?.core_hours ?? 0) +
                  (stageData.averages?.deep_hours ?? 0) +
                  (stageData.averages?.rem_hours ?? 0)) > 0;
              return (
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-xl border border-accent/30 bg-card p-4">
                    {hasStages ? (
                      <SleepStageChart
                        data={stageData}
                        height={200}
                        label={sleepStageLabel(summary?.days, locale)}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {sleepStageLabel(summary?.days, locale)}
                        </p>
                        <ChartEmptyState
                          height={200}
                          title="Sleep stage pattern forming"
                          message="More consistent sleep tracking will unlock this view"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Readiness — Impact */}
            {(() => {
              const score = sections?.recovery_signals?.recovery_composite_score;
              const hasScore = score != null && typeof score === "number";
              return (
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-xl border border-border bg-card p-4">
                    {hasScore ? (
                      <RecoveryScoreChart
                        score={score}
                        height={200}
                        label={recoveryLabel(summary?.days, locale)}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {recoveryLabel(summary?.days, locale)}
                        </p>
                        <ChartEmptyState
                          height={200}
                          title="Recovery pattern still building"
                          message="We need a few active days to understand this pattern"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Daily Energy — Possible cause */}
            {(() => {
              const activitySignals = sections?.activity_signals;
              const hasEnergy = activitySignals?.basal_energy_cal?.mean != null;
              return (
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-xl border border-border bg-card p-4">
                    {hasEnergy ? (
                      <DailyEnergyChart
                        data={activitySignals}
                        height={200}
                        label={energyLabel(summary?.days, locale)}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {energyLabel(summary?.days, locale)}
                        </p>
                        <ChartEmptyState
                          height={200}
                          title="Energy pattern forming"
                          message="Your energy view appears once enough activity data is available"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>

        {/* 5. Preview insight (before CTA) */}
        {previewInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-4 mx-auto max-w-lg rounded-lg border border-accent/15 bg-accent/[0.04] px-5 py-4 text-center"
          >
            <div className="text-[10px] uppercase opacity-60 mb-1">NEW: previewInsight</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium uppercase tracking-wider text-accent/80">
                {t.result.preview.basedOnAnalysis}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {previewInsight}
            </p>
          </motion.div>
        )}

        {/* Sprint 25.5: first mid-page CTA hidden — moved to end after core blocks */}
        {false && !embedded && (
          <div ref={fullReportRef} className="mt-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {t.result.preview.fullReport.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {t.result.preview.fullReport.description}
              </p>
            </motion.div>
            {/* CTA button — Sprint 25.4: now appears AFTER previewInsight */}
            <div className="text-[10px] uppercase opacity-60 mt-4 mb-1">NEW: ctaPrimary</div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="mt-1 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  trackReportUnlockClicked("bottom");
                  onOpenModal?.();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e6b800] text-[#1a1a1a] text-sm font-medium shadow-sm transition-colors duration-200 hover:bg-[#f2c94c] active:bg-[#c99a00]"
              >
                <Crown className="h-4 w-4" />
                {t.result.preview.fullReport.downloadButton}
              </button>
            </motion.div>
            {/* 7. Plan comparison cards (Sprint 18.6.5, localized Sprint 25.4) */}
            <div className="text-[10px] uppercase opacity-60 mt-6 mb-1">NEW: planComparison</div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="mt-2 mx-auto max-w-3xl"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center mb-5">
                {t.result.preview.comparePlans}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Free */}
                <div className="rounded-xl border border-border bg-card p-5 text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {t.result.preview.plans.free.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.result.preview.plans.free.tagline}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>{t.result.preview.plans.free.singleUpload}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>{t.result.preview.plans.free.previewInsights}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>{t.result.preview.plans.free.basicTrend}</span>
                    </li>
                  </ul>
                </div>
                {/* Premium — gold highlight (Sprint 25.4) */}
                <div className="rounded-xl border-2 border-[#e6b800] bg-[#e6b800]/5 p-5 text-left ring-1 ring-[#e6b800]/20 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#e6b800] mb-1">
                    {t.result.preview.plans.premium.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.result.preview.plans.premium.tagline}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.longitudinal}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.baseline}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.actionable}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.dashboard}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.export}</span>
                    </li>
                  </ul>
                </div>
                {/* Super Premium */}
                <div className="rounded-xl border border-border bg-card p-5 text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {t.result.preview.plans.superPremium.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.result.preview.plans.superPremium.tagline}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.everything}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.advancedRecovery}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.circadian}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.multiPeriod}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-[10px] text-muted-foreground/60 italic">
                    {t.result.preview.plans.superPremium.comingSoon}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        <div className="hidden md:block">
          {false && (<>
          <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: legacyDesktopHero</div>
          {/* Hero: Sleep */}
          <section
            className={`grid grid-cols-2 gap-8 items-start transition-all duration-500 ease-out ${
              sleepVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            {/* Left column — text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center py-4"
            >
              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: desktopHero: headline</div>
              <h1 className="text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-3">
                {adaptiveHeadline}
              </h1>

              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: desktopHero: metadata</div>
              {/* Sprint 25.5: metadata hidden — shown in dataProvenance block */}
              {false && durationInfo && (
                <p className="text-sm text-muted-foreground mb-6">
                  {t.result.preview.builtFromPrefix}{" "}
                  <span className="font-semibold text-foreground">
                    {durationInfo?.label}
                  </span>{" "}
                  {t.result.preview.builtFromSuffix}
                </p>
              )}

              {/* Primary sleep insight */}
              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: desktopHero: description</div>
              {sleepInsights.length > 0 && (
                <div className="space-y-3 mb-6">
                  {sleepInsights.slice(0, 2).map((ins) => (
                    <div key={`d-sleep-${ins.headline}`}>
                      <p className="text-sm font-medium text-foreground">
                        {ins.headline}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {ins.body}
                      </p>
                      {ins.meaning && (
                        <p className="text-xs text-muted-foreground/80 italic leading-relaxed mt-0.5">
                          {ins.meaning}
                        </p>
                      )}
                      {/* Action hint — Sprint 17.0 */}
                      {ins.action && (
                        <p className="text-xs text-accent/90 leading-relaxed font-medium mt-1">
                          → {ins.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: desktopHero: subtext</div>
              {sleepInsights.length === 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  {t.result.preview.sleepHero.emptyState}
                </p>
              )}
            </motion.div>

            {/* Right column — chart */}
            <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: desktopHero: chart</div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t.result.preview.sections.sleepPattern}
                </span>
              </div>
              {locale !== "en-IE" && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {t.result.preview.insightsInEnglish}
                </p>
              )}
              {sleepChartOption ? (
                <EChart
                  option={sleepChartOption!}
                  height={280}
                  onInteraction={() => handleChartInteraction("sleep")}
                />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  {t.result.preview.emptyChart}
                </div>
              )}
            </motion.div>
          </section>
          </>)}

          <div className="text-[10px] uppercase opacity-60 mt-4 mb-1">LEGACY: legacyDesktopRecoveryActivity</div>
          {/* Lower compact zone— Sleep + Recovery + Activity */}
          <section className="grid grid-cols-3 gap-6 mt-2">
            {/* Sleep card */}
            <div
              id="sleep-desktop"
              className={`scroll-mt-28 h-full transition-all duration-500 ease-out ${
                sleepVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <InsightCard
                title={t.result.preview.sections.sleepPattern}
                icon={<Moon className="h-4 w-4" />}
                insights={sleepInsights.slice(0, 1)}
                compact
                chart={
                  sleepChartOption ? (
                    <EChart
                      option={sleepChartOption}
                      height={180}
                      onInteraction={() => handleChartInteraction("sleep")}
                    />
                  ) : undefined
                }
              />
            </div>

            {/* Recovery card */}
            <div
              id="recovery-desktop"
              className={`scroll-mt-28 h-full transition-all duration-500 ease-out ${
                recoveryVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <InsightCard
                title={t.result.preview.sections.recovery}
                icon={<HeartPulse className="h-4 w-4" />}
                insights={recoveryInsights.slice(0, 1)}
                compact
                chart={
                  recoveryChartOption ? (
                    <EChart
                      option={recoveryChartOption}
                      height={180}
                      onInteraction={() => handleChartInteraction("recovery")}
                    />
                  ) : undefined
                }
              />
            </div>

            {/* Activity card */}
            <div
              id="activity-desktop"
              className={`scroll-mt-28 h-full transition-all duration-500 ease-out ${
                activityVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <InsightCard
                title={t.result.preview.sections.activityMobility}
                icon={<Footprints className="h-4 w-4" />}
                insights={activityInsights.slice(0, 1)}
                compact
                chart={
                  activityChartOption ? (
                    <EChart
                      option={activityChartOption}
                      height={180}
                      onInteraction={() => handleChartInteraction("activity")}
                    />
                  ) : undefined
                }
              />
            </div>
          </section>
        </div>

        {/* ============================================================= */}
        {/* MOBILE LAYOUT — stacked scrollable cards                       */}
        {/* ============================================================= */}
        <div className="md:hidden space-y-6">
          {false && (<>
          <div className="text-[10px] uppercase opacity-60">LEGACY: legacyMobileHero</div>
          {/* Sleep card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`transition-all duration-500 ease-out ${
              sleepVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: mobileHero: headline</div>
              <h1 className="text-2xl font-semibold text-foreground leading-tight mb-2">
                {adaptiveHeadline}
              </h1>

              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: mobileHero: metadata</div>
              {/* Sprint 25.5: metadata hidden — shown in dataProvenance block */}
              {false && durationInfo && (
                <p className="text-xs text-muted-foreground mb-4">
                  {t.result.preview.builtFromPrefix}{" "}
                  <span className="font-semibold text-foreground">
                    {durationInfo?.label}
                  </span>{" "}
                  {t.result.preview.builtFromSuffix}
                </p>
              )}

              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: mobileHero: description</div>
              {sleepInsights.length > 0 && (
                <div className="space-y-2 mb-4">
                  {sleepInsights.slice(0, 2).map((ins) => (
                    <div key={`m-sleep-${ins.headline}`}>
                      <p className="text-sm font-medium text-foreground">
                        {ins.headline}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ins.body}
                      </p>
                      {ins.meaning && (
                        <p className="text-xs text-muted-foreground/80 italic mt-0.5">
                          {ins.meaning}
                        </p>
                      )}
                      {/* Action hint — Sprint 17.0 */}
                      {ins.action && (
                        <p className="text-xs text-accent/90 font-medium mt-1">
                          → {ins.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] uppercase opacity-60 mb-1">LEGACY: mobileHero: chart</div>
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t.result.preview.sections.sleepPattern}
                </span>
              </div>
              {locale !== "en-IE" && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {t.result.preview.insightsInEnglish}
                </p>
              )}
              {sleepChartOption ? (
                <EChart
                  option={sleepChartOption!}
                  height={220}
                  onInteraction={() => handleChartInteraction("sleep")}
                />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  {t.result.preview.emptyChart}
                </div>
              )}
            </div>
          </motion.div>
          </>)}

          <div className="text-[10px] uppercase opacity-60">LEGACY: legacyMobileRecoveryActivity</div>
          <section
            className={`scroll-mt-28 transition-all duration-500 ease-out ${
              sleepVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <InsightCard
              title={t.result.preview.sections.sleepPattern}
              icon={<Moon className="h-4 w-4" />}
              insights={sleepInsights.slice(0, 1)}
              chart={
                sleepChartOption ? (
                  <EChart
                    option={sleepChartOption}
                    height={200}
                    onInteraction={() => handleChartInteraction("sleep")}
                  />
                ) : undefined
              }
            />
          </section>

          <section
            id="recovery-mobile"
            className={`scroll-mt-28 transition-all duration-500 ease-out ${
              recoveryVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <InsightCard
              title={t.result.preview.sections.recovery}
              icon={<HeartPulse className="h-4 w-4" />}
              insights={recoveryInsights.slice(0, 1)}
              chart={
                recoveryChartOption ? (
                  <EChart
                    option={recoveryChartOption}
                    height={200}
                    onInteraction={() => handleChartInteraction("recovery")}
                  />
                ) : undefined
              }
              ctaLabel={t.result.preview.cta.exploreActivity}
              onCtaClick={goToActivity}
            />
          </section>

          <section
            id="activity-mobile"
            className={`scroll-mt-28 transition-all duration-500 ease-out ${
              activityVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <InsightCard
              title={t.result.preview.sections.activityMobility}
              icon={<Footprints className="h-4 w-4" />}
              insights={activityInsights.slice(0, 1)}
              chart={
                activityChartOption ? (
                  <EChart
                    option={activityChartOption}
                    height={200}
                    onInteraction={() => handleChartInteraction("activity")}
                  />
                ) : undefined
              }
            />
          </section>
        </div>

        {/* ============================================================= */}
        {/* Full Report CTA — hidden when embedded in portal               */}
        {/* ============================================================= */}
        {!embedded && (
          <div ref={fullReportRef} className="mt-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {t.result.preview.fullReport.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {t.result.preview.fullReport.description}
              </p>
            </motion.div>

            {/* Sprint 25.5: previewInsight duplicate hidden — shown at position 6 above core blocks */}
            {false && previewInsight && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="mt-4 mx-auto max-w-lg rounded-lg border border-accent/15 bg-accent/[0.04] px-5 py-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium uppercase tracking-wider text-accent/80">
                    {t.result.preview.basedOnAnalysis}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {previewInsight}
                </p>
              </motion.div>
            )}

            {/* CTA button — Sprint 25.4: now appears AFTER previewInsight */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  trackReportUnlockClicked("bottom");
                  onOpenModal?.();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e6b800] text-[#1a1a1a] text-sm font-medium shadow-sm transition-colors duration-200 hover:bg-[#f2c94c] active:bg-[#c99a00]"
              >
                <Crown className="h-4 w-4" />
                {t.result.preview.fullReport.downloadButton}
              </button>
            </motion.div>

            {/* Plan comparison cards (Sprint 18.6.5, localized Sprint 25.4) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="mt-8 mx-auto max-w-3xl"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center mb-5">
                {t.result.preview.comparePlans}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Free */}
                <div className="rounded-xl border border-border bg-card p-5 text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {t.result.preview.plans.free.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.result.preview.plans.free.tagline}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>{t.result.preview.plans.free.singleUpload}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>{t.result.preview.plans.free.previewInsights}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>{t.result.preview.plans.free.basicTrend}</span>
                    </li>
                  </ul>
                </div>
                {/* Premium — gold highlight (Sprint 25.4) */}
                <div className="rounded-xl border-2 border-[#e6b800] bg-[#e6b800]/5 p-5 text-left ring-1 ring-[#e6b800]/20 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#e6b800] mb-1">
                    {t.result.preview.plans.premium.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.result.preview.plans.premium.tagline}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.longitudinal}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.baseline}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.actionable}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.dashboard}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#e6b800]" />
                      <span>{t.result.preview.plans.premium.export}</span>
                    </li>
                  </ul>
                </div>
                {/* Super Premium */}
                <div className="rounded-xl border border-border bg-card p-5 text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {t.result.preview.plans.superPremium.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.result.preview.plans.superPremium.tagline}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.everything}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.advancedRecovery}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.circadian}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>
                        {t.result.preview.plans.superPremium.multiPeriod}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-[10px] text-muted-foreground/60 italic">
                    {t.result.preview.plans.superPremium.comingSoon}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
