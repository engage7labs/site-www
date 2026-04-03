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
  buildDurationMessage,
  formatDatasetDuration,
  type DurationInfo,
} from "@/lib/formatting";
import {
  extractActivityInsights,
  extractRecoveryInsights,
  extractSleepInsights,
} from "@/lib/insights";
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
import { ArrowLeft, Crown, Footprints, HeartPulse, Moon } from "lucide-react";
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
// Component
// ---------------------------------------------------------------------------

export function InsightPreview({
  result,
  jobId,
  theme,
  onOpenModal,
  embedded,
}: Readonly<InsightPreviewProps>) {
  const { t } = useLocale();
  const isDark = useDarkMode(theme);
  const sections: Sections | null = result.sections ?? null;
  const summary = result.summary;

  // ---- Duration ---------------------------------------------------------
  const durationInfo: DurationInfo | null = useMemo(
    () => formatDatasetDuration(summary?.days ?? null),
    [summary?.days]
  );
  const durationMessage = useMemo(
    () => buildDurationMessage(summary?.days ?? null),
    [summary?.days]
  );

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
        {/* DESKTOP LAYOUT — two-column hero + compact lower zone         */}
        {/* ============================================================= */}
        <div className="hidden md:block">
          {/* Hero: Sleep */}
          <section className="grid grid-cols-2 gap-8 items-start">
            {/* Left column — text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center py-4"
            >
              <h1 className="text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-3">
                {t.result.preview.sleepHero.title}{" "}
                <span className="text-accent">
                  {t.result.preview.sleepHero.titleHighlight}
                </span>
              </h1>

              {durationMessage && (
                <p className="text-sm text-muted-foreground mb-6">
                  {durationMessage}
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
            <div id="recovery-desktop" className="scroll-mt-28 h-full">
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
            <div id="activity-desktop" className="scroll-mt-28 h-full">
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
          >
            <div className="rounded-xl border border-border bg-card p-5">
              <h1 className="text-2xl font-semibold text-foreground leading-tight mb-2">
                {t.result.preview.sleepHero.title}{" "}
                <span className="text-accent">
                  {t.result.preview.sleepHero.titleHighlight}
                </span>
              </h1>

              {durationMessage && (
                <p className="text-xs text-muted-foreground mb-4">
                  {durationMessage}
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

          <section id="recovery-mobile" className="scroll-mt-28">
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

          <section id="activity-mobile" className="scroll-mt-28">
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
        {/* Full Report CTA (shared desktop + mobile)                      */}
        {/* ============================================================= */}
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
        </div>
      </main>
    </div>
  );
}
