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
import {
  formatDatasetDuration,
  type DurationInfo,
} from "@/lib/formatting";
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
import { DailyEnergyChart } from "./daily-energy-chart";
import { RecoveryScoreChart } from "./recovery-score-chart";
import { SleepStageChart } from "./sleep-stage-chart";
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
import { EChart } from "./echart";
import { InsightCard } from "./insight-card";

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
 * Uses the dataset days from the summary (total dataset duration).
 */
function chartPeriodSuffix(days: number | null | undefined, locale: string): string {
  const isPt = locale === "pt-BR";
  if (days == null || days <= 0) {
    return isPt ? "média geral" : "all-time avg";
  }
  const d = Math.round(days);
  return isPt ? `últimos ${d} dias` : `last ${d} days`;
}

function sleepStageLabel(days: number | null | undefined, locale: string): string {
  const isPt = locale === "pt-BR";
  const period = chartPeriodSuffix(days, locale);
  return isPt
    ? `Estágios do sono — média por noite (${period})`
    : `Sleep stages — avg per night (${period})`;
}

function recoveryLabel(days: number | null | undefined, locale: string): string {
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

  // Is any new signal data available?
  const hasNewSignals =
    (sections?.sleep_stages?.has_stage_data === true) ||
    (sections?.recovery_signals?.recovery_composite_score != null) ||
    (sections?.activity_signals?.basal_energy_cal != null);

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
        {/* ============================================================= */}
        {/* SURPRISING PERSONAL INSIGHT — Sprint 19.0                     */}
        {/* Appears BEFORE charts to create curiosity and perceived value  */}
        {/* ============================================================= */}
        {surprisingInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 mx-auto max-w-2xl rounded-xl border border-accent/20 bg-accent/[0.04] px-5 py-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent/80">
                Your data reveals
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {surprisingInsight}
            </p>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* ENGINE INSIGHTS — Sprint 25.0 / 25.1 / 25.2                  */}
        {/* Hero (first) + secondary grid. Locale-aware pillar badges.   */}
        {/* HRV tooltip when applicable. Max 3. Contract-validated.      */}
        {/* ============================================================= */}
        {engineInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
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
                  const isHrv = ins.metrics_used.includes("hrv_sdnn_mean_median");
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

        {/* ============================================================= */}
        {/* NEW SIGNALS BLOCK — Sprint 24.3                               */}
        {/* Rendered BEFORE existing sections when new data is available  */}
        {/* ============================================================= */}
        {hasNewSignals && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            {/* Narrative connector — only shown when engine insights are also visible */}
            {engineInsights.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border/25" />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider shrink-0">
                  {locale === "pt-BR" ? "o que isso significa" : "what this means"}
                </span>
                <div className="h-px flex-1 bg-border/25" />
              </div>
            )}

            {/* Charts with narrative roles — Evidence → Impact → Possible cause */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Sleep — Evidence (primary, stronger border as "proof") */}
              {sections?.sleep_stages?.has_stage_data && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                    {locale === "pt-BR" ? "Evidência" : "Evidence"}
                  </p>
                  <div className="rounded-xl border border-accent/30 bg-card p-4">
                    <SleepStageChart
                      data={sections.sleep_stages}
                      height={200}
                      label={sleepStageLabel(summary?.days, locale)}
                    />
                  </div>
                </div>
              )}
              {/* Readiness — Impact */}
              {sections?.recovery_signals?.recovery_composite_score != null && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                    {locale === "pt-BR" ? "Impacto" : "Impact"}
                  </p>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <RecoveryScoreChart
                      score={sections.recovery_signals.recovery_composite_score}
                      height={200}
                      label={recoveryLabel(summary?.days, locale)}
                    />
                  </div>
                </div>
              )}
              {/* Activity — Possible cause */}
              {sections?.activity_signals?.basal_energy_cal != null && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                    {locale === "pt-BR" ? "Possível causa" : "Possible cause"}
                  </p>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <DailyEnergyChart
                      data={sections.activity_signals}
                      height={200}
                      label={energyLabel(summary?.days, locale)}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* DESKTOP LAYOUT — two-column hero + compact lower zone         */}
        {/* ============================================================= */}
        <div className="hidden md:block">
          {/* Hero: Sleep */}
          <section className={`grid grid-cols-2 gap-8 items-start transition-all duration-500 ease-out ${sleepVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            {/* Left column — text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center py-4"
            >
              <h1 className="text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-3">
                {adaptiveHeadline}
              </h1>

              {durationInfo && (
                <p className="text-sm text-muted-foreground mb-6">
                  Built from{" "}
                  <span className="font-semibold text-foreground">{durationInfo.label}</span>{" "}
                  of your personal data
                </p>
              )}

              {/* Primary sleep insight */}
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

              {sleepInsights.length === 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  {t.result.preview.sleepHero.emptyState}
                </p>
              )}
            </motion.div>

            {/* Right column — chart */}
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
                  option={sleepChartOption}
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

          {/* Lower compact zone— Recovery + Activity */}
          <section className="grid grid-cols-2 gap-6 mt-6">
            {/* Recovery card */}
            <div id="recovery-desktop" className={`scroll-mt-28 h-full transition-all duration-500 ease-out ${recoveryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              <InsightCard
                title={t.result.preview.sections.recovery}
                icon={<HeartPulse className="h-4 w-4" />}
                insights={recoveryInsights}
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
            <div id="activity-desktop" className={`scroll-mt-28 h-full transition-all duration-500 ease-out ${activityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              <InsightCard
                title={t.result.preview.sections.activityMobility}
                icon={<Footprints className="h-4 w-4" />}
                insights={activityInsights}
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
          {/* Sleep card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`transition-all duration-500 ease-out ${sleepVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            <div className="rounded-xl border border-border bg-card p-5">
              <h1 className="text-2xl font-semibold text-foreground leading-tight mb-2">
                {adaptiveHeadline}
              </h1>

              {durationInfo && (
                <p className="text-xs text-muted-foreground mb-4">
                  Built from{" "}
                  <span className="font-semibold text-foreground">{durationInfo.label}</span>{" "}
                  of your personal data
                </p>
              )}

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
                  option={sleepChartOption}
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

          <section id="recovery-mobile" className={`scroll-mt-28 transition-all duration-500 ease-out ${recoveryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <InsightCard
              title={t.result.preview.sections.recovery}
              icon={<HeartPulse className="h-4 w-4" />}
              insights={recoveryInsights}
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

          <section id="activity-mobile" className={`scroll-mt-28 transition-all duration-500 ease-out ${activityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <InsightCard
              title={t.result.preview.sections.activityMobility}
              icon={<Footprints className="h-4 w-4" />}
              insights={activityInsights}
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
              </div>
            </motion.div>

            {/* Preview Insight — data-driven teaser (Sprint 17.6.2, refined 18.6.5) */}
            {previewInsight && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="mt-6 mx-auto max-w-lg rounded-lg border border-accent/15 bg-accent/[0.04] px-5 py-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium uppercase tracking-wider text-accent/80">
                    Based on your analysis
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {previewInsight}
                </p>
              </motion.div>
            )}

            {/* Plan comparison cards (Sprint 18.6.5) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="mt-8 mx-auto max-w-3xl"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center mb-5">
                Compare plans
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Free */}
                <div className="rounded-xl border border-border bg-card p-5 text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Free
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get started with your data
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Single analysis upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Preview insights (sleep, recovery, activity)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Basic trend visualization</span>
                    </li>
                  </ul>
                </div>
                {/* Premium — emphasized */}
                <div className="rounded-xl border-2 border-accent bg-accent/5 p-5 text-left ring-1 ring-accent/20 shadow-sm">
                  <h3 className="text-sm font-semibold text-accent mb-1">
                    Premium
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Full insight experience
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                      <span>Longitudinal insights across all signals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                      <span>Personalized baseline comparisons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                      <span>Actionable improvement suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                      <span>Full private health dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                      <span>PDF & CSV report export</span>
                    </li>
                  </ul>
                </div>
                {/* Super Premium */}
                <div className="rounded-xl border border-border bg-card p-5 text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Super Premium
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Deep analysis modules
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Everything in Premium</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Advanced recovery analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Circadian rhythm mapping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/60" />
                      <span>Multi-period trend comparison</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-[10px] text-muted-foreground/60 italic">
                    * Advanced modules in development
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
