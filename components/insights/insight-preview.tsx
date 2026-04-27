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
  type DarthPayload,
  type DarthProofChart,
  type DarthTeaser,
  getDarthPayload,
  getDarthPresentation,
  getDarthTeaser,
  selectDarthCopy,
  selectDarthCta,
} from "@/lib/darth";
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
import { trackPremiumCtaClicked } from "@/lib/telemetry";
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
import type { ReactNode } from "react";
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

function assertDarthContract(darth: DarthPayload): void {
  const missing: string[] = [];
  if (!darth.state) missing.push("state");
  if (!darth.trajectory) missing.push("trajectory");
  if (!darth.primary_claim) missing.push("primary_claim");
  if (!darth.baseline_context?.headline) missing.push("baseline_context.headline");
  if (!darth.baseline_context?.explanation) missing.push("baseline_context.explanation");
  if (darth.confidence == null) missing.push("confidence");
  if (!darth.dominant_signal) missing.push("dominant_signal");
  if (!darth.guidance?.statement) missing.push("guidance.statement");
  if (!darth.guidance?.recommended_adjustment) {
    missing.push("guidance.recommended_adjustment");
  }
  if (!darth.consequence?.summary) missing.push("consequence.summary");
  if (!darth.consequence?.if_pattern_continues) {
    missing.push("consequence.if_pattern_continues");
  }
  if (!darth.consequence?.scope) missing.push("consequence.scope");
  if (!darth.consequence?.severity) missing.push("consequence.severity");
  if (!darth.evidence) missing.push("evidence");
  if (!Array.isArray(darth.charts) || darth.charts.length === 0) {
    missing.push("charts");
  }

  darth.charts?.forEach((chart, index) => {
    if (!chart.role) missing.push(`charts.${index}.role`);
    if (!chart.metric) missing.push(`charts.${index}.metric`);
    if (!chart.window) missing.push(`charts.${index}.window`);
    if (chart.baseline_reference !== "baseline_30d") {
      missing.push(`charts.${index}.baseline_reference`);
    }
    if (!chart.proof_statement) missing.push(`charts.${index}.proof_statement`);
    if (chart.priority == null) missing.push(`charts.${index}.priority`);
    if (!chart.claim_relation) missing.push(`charts.${index}.claim_relation`);
  });

  if (missing.length > 0) {
    throw new Error(`Incomplete DARTH teaser contract: ${missing.join(", ")}`);
  }
}

function hasDarthClaimContract(darth: DarthPayload | null): darth is DarthPayload {
  return Boolean(
    darth?.primary_claim &&
      darth.baseline_context?.headline &&
      darth.baseline_context?.explanation &&
      darth.consequence?.summary &&
      darth.consequence?.if_pattern_continues &&
      darth.guidance?.statement
  );
}

// ---------------------------------------------------------------------------
// Locale helpers (Sprint 25.2)
// ---------------------------------------------------------------------------

// translatePillar removed in Sprint 25.11 — pillar labels now come from t.portal.insightsPage.pillar.*

// Chart label helpers removed in Sprint 25.11 — replaced by t.teaser.charts.* dictionary keys

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
  const darthPayload = useMemo(
    () => getDarthPayload(result.sections),
    [result.sections]
  );
  const darthPresentation = useMemo(
    () => getDarthPresentation(result.sections),
    [result.sections]
  );
  const darthTeaser = useMemo(
    () => getDarthTeaser(result.sections),
    [result.sections]
  );
  const usesDarthTeaser = Boolean(
    darthTeaser?.headline &&
      darthTeaser.subtext &&
      darthTeaser.action &&
      darthTeaser.cta
  );
  const usesDarth = useMemo(() => {
    if (usesDarthTeaser) return false;
    if (!darthPayload) return false;
    if (!hasDarthClaimContract(darthPayload)) return false;
    assertDarthContract(darthPayload);
    return true;
  }, [darthPayload, usesDarthTeaser]);
  const darthSupporting = useMemo(
    () =>
      (darthPresentation?.supporting ?? []).map((block) => ({
        block,
        copy: selectDarthCopy(block.copy, locale),
      })),
    [darthPresentation, locale]
  );
  const darthCta = useMemo(
    () => selectDarthCta(darthPresentation?.cta, locale),
    [darthPresentation, locale]
  );
  const darthProofCharts = useMemo(() => {
    const roleOrder: Record<DarthProofChart["role"], number> = {
      evidence: 0,
      supporting: 1,
      conflict: 2,
    };
    return [...(darthPayload?.charts ?? [])].sort((a, b) => {
      const roleDelta = roleOrder[a.role] - roleOrder[b.role];
      if (roleDelta !== 0) return roleDelta;
      const priorityDelta = a.priority - b.priority;
      if (priorityDelta !== 0) return priorityDelta;
      return a.metric.localeCompare(b.metric);
    });
  }, [darthPayload]);
  const topEvidenceCharts = useMemo(
    () => darthProofCharts.slice(0, 3),
    [darthProofCharts]
  );

  // ---- Duration ---------------------------------------------------------
  const durationInfo: DurationInfo | null = useMemo(
    () => formatDatasetDuration(summary?.days ?? null),
    [summary?.days]
  );

  // ---- Last-7-day date range label for evidence charts ------------------
  const last7DRange = useMemo((): string | null => {
    const endRaw = summary?.dataset_end;
    if (!endRaw) return null;
    const end = new Date(String(endRaw));
    if (isNaN(end.getTime())) return null;
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Last 7 days (${fmt(start)} – ${fmt(end)})`;
  }, [summary?.dataset_end]);

  // Adaptive headline — based on sleep consistency (Sprint 24.0.1)
  const adaptiveHeadline = useMemo((): string => {
    const cv = sections?.volatility?.sleep_hours?.cv;
    const cvNum = cv != null ? Number(cv) : null;
    if (cvNum == null || isNaN(cvNum)) {
      return t.teaser.hero.adaptiveClear;
    }
    if (cvNum < 20) {
      return t.teaser.hero.adaptiveSteady;
    }
    return t.teaser.hero.adaptiveShifting;
  }, [sections, t]);
  const stateHeadline = useMemo(
    () =>
      darthTeaser?.headline ??
      (usesDarth ? darthPayload?.primary_claim ?? adaptiveHeadline : adaptiveHeadline),
    [adaptiveHeadline, darthPayload, darthTeaser, usesDarth]
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
    scrollToSection("activity");
  };

  const handleChartInteraction = (_insightType: string) => {};

  // ---- Full report CTA --------------------------------------------------
  const fullReportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fullReportRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(fullReportRef.current);
    return () => obs.disconnect();
  }, []);

  function renderChartRole(role: DarthProofChart["role"] | undefined) {
    if (role === "conflict") return "Conflict";
    if (role === "supporting") return t.teaser.chartRoles.support;
    return t.teaser.chartRoles.evidence;
  }

  function renderClaimRelation(relation: DarthProofChart["claim_relation"] | undefined) {
    if (relation === "shows_conflict") return "shows conflict";
    if (relation === "shows_driver") return "shows driver";
    return "supports claim";
  }

  function renderDivergenceChart(chart: DarthProofChart) {
    const signals = chart.signals?.slice(0, 2) ?? [];
    return (
      <div className="h-[200px] rounded-lg border border-[#e6b800]/25 bg-background/40 px-4 py-5">
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex h-full flex-col justify-end rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
            <div className="h-2/3 rounded-md bg-emerald-500/35" />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
              {(signals[0] ?? "support signal").replaceAll("_", " ")}
            </p>
          </div>
          <div className="flex h-full flex-col items-center justify-center">
            <div className="h-full w-px bg-[#e6b800]/35" />
            <span className="my-2 rounded-full border border-[#e6b800]/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e6b800]">
              Divergence
            </span>
            <div className="h-full w-px bg-[#e6b800]/35" />
          </div>
          <div className="flex h-full flex-col justify-start rounded-lg border border-rose-500/25 bg-rose-500/[0.06] p-3">
            <div className="h-2/3 rounded-md bg-rose-500/35" />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
              {(signals[1] ?? "recovery signal").replaceAll("_", " ")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderDarthProofChartCard(chart: DarthProofChart) {
    const chartId = chart.id.split("_2")[0].split("_3")[0];
    const cardClass =
      "rounded-xl border border-[#e6b800]/45 bg-[#e6b800]/[0.035] p-4 shadow-sm";
    const roleLabel = renderChartRole(chart.role);

    let visual: ReactNode = null;
    if (chart.type === "divergence") {
      visual = renderDivergenceChart(chart);
    } else if (chartId === "sleep_stages") {
      const stageData = sections?.sleep_stages;
      const hasStages =
        stageData?.has_stage_data === true &&
        ((stageData.averages?.core_hours ?? 0) +
          (stageData.averages?.deep_hours ?? 0) +
          (stageData.averages?.rem_hours ?? 0)) > 0;
      visual = hasStages ? (
        <SleepStageChart
          data={stageData}
          height={200}
          label={t.teaser.charts.sleepStages}
        />
      ) : null;
    } else if (chartId === "recovery_score") {
      const score = sections?.recovery_signals?.recovery_composite_score;
      const hasScore = score != null && typeof score === "number";
      visual = hasScore ? (
        <RecoveryScoreChart
          score={score}
          height={200}
          label={t.teaser.charts.recovery}
        />
      ) : null;
    } else if (chartId === "daily_energy") {
      const activitySignals = sections?.activity_signals;
      const hasEnergy = activitySignals?.basal_energy_cal?.mean != null;
      visual = hasEnergy ? (
        <DailyEnergyChart
          data={activitySignals}
          height={200}
          label={t.teaser.charts.energy}
        />
      ) : null;
    }

    if (!visual) {
      throw new Error(`DARTH proof chart cannot render: ${chart.id}`);
    }

    return (
      <div className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e6b800]">
            {roleLabel} · {renderClaimRelation(chart.claim_relation)}
          </span>
          <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {chart.window.replaceAll("_", " ")} vs {chart.baseline_reference.replaceAll("_", " ")}
          </span>
        </div>
        {visual}
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="text-sm font-semibold leading-snug text-foreground">
            {chart.annotation.insight}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {chart.proof_statement}
          </p>
        </div>
      </div>
    );
  }

  function renderTeaserVisual(teaser: DarthTeaser) {
    const evidence = teaser.evidence?.[0] ?? null;
    const visual = teaser.visual;
    const metricLabel = visual.metric?.replaceAll("_", " ") ?? null;
    const windowLabel = visual.window?.replaceAll("_", " ") ?? null;
    const roleLabel = visual.role === "none" ? null : visual.role;

    return (
      <div className="rounded-xl border border-[#e6b800]/35 bg-background/45 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {roleLabel && (
            <span className="rounded-full border border-[#e6b800]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e6b800]">
              {roleLabel}
            </span>
          )}
          {windowLabel && (
            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {windowLabel}
            </span>
          )}
        </div>
        <div className="flex h-[180px] flex-col justify-end rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          {visual.type === "line" ? (
            <div className="flex h-full items-end gap-2">
              {[28, 48, 36, 64, 52, 76, 68].map((height, index) => (
                <div
                  key={`${metricLabel ?? "teaser"}-${height}-${index}`}
                  className="flex-1 rounded-t bg-[#e6b800]/35"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-border/70">
              <Crown className="h-7 w-7 text-[#e6b800]" />
            </div>
          )}
          {metricLabel && (
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {metricLabel}
            </p>
          )}
        </div>
        {evidence && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="text-sm font-semibold leading-snug text-foreground">
              {evidence.statement}
            </p>
            {(evidence.value != null || evidence.comparison) && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {[evidence.value, evidence.comparison].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderDarthTeaser(teaser: DarthTeaser) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 rounded-xl border border-[#e6b800]/45 bg-[radial-gradient(circle_at_top_left,rgba(230,184,0,0.12),transparent_40%),rgba(230,184,0,0.035)] p-5 shadow-sm md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-6 md:p-6"
      >
        <div className="flex min-w-0 flex-col">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6b800] px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a]">
              <Crown className="h-3.5 w-3.5" />
              {teaser.badge?.label ?? "Free"}
            </span>
            <span className="rounded-full border border-border/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {teaser.archetype}
            </span>
          </div>
          <h2 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {teaser.headline}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {teaser.subtext}
          </p>
          <div className="mt-5 rounded-lg border border-[#e6b800]/30 bg-[#e6b800]/[0.04] p-4">
            <p className="text-base font-semibold leading-snug text-foreground">
              {teaser.action}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              trackPremiumCtaClicked("darth_teaser");
              onOpenModal?.();
            }}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e6b800] px-5 py-3 text-sm font-semibold text-[#1a1a1a] shadow-sm transition-colors duration-200 hover:bg-[#f2c94c] active:bg-[#c99a00] sm:w-fit"
          >
            <Crown className="h-4 w-4" />
            {teaser.cta}
          </button>
        </div>
        <div className="mt-5 md:mt-0">{renderTeaserVisual(teaser)}</div>
      </motion.section>
    );
  }

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
        {!usesDarthTeaser && (
          <h1 className="text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-6">
            {stateHeadline}
          </h1>
        )}

        {usesDarthTeaser && darthTeaser && renderDarthTeaser(darthTeaser)}

        {/* 2. Surprising personal insight */}
        {!usesDarthTeaser && !usesDarth && surprisingInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 mx-auto max-w-2xl rounded-xl border border-accent/20 bg-accent/[0.04] px-5 py-4 text-center"
          >
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

        {/* 2. DARTH baseline context */}
        {usesDarth && darthPayload?.baseline_context && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-[#e6b800] bg-[#e6b800]/5 p-5 mb-6 flex flex-col gap-2"
          >
            <p className="text-sm font-bold text-foreground">
              {darthPayload.baseline_context.headline}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {darthPayload.baseline_context.explanation}
            </p>
            {summary?.dataset_start && summary?.dataset_end && (
              <p className="text-[11px] text-muted-foreground/70 font-mono">
                {String(summary.dataset_start)} - {String(summary.dataset_end)}
              </p>
            )}
          </motion.div>
        )}

        {/* 2. Provenance card (gold) */}
        {!usesDarthTeaser && !usesDarth && (durationInfo || summary?.dataset_start) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-[#e6b800] bg-[#e6b800]/5 p-4 mb-6 flex flex-col gap-1"
          >
            <div className="flex-1 min-w-0">
              {/* Sprint 25.5: Option A provenance text — Sprint 25.11: localized */}
              <p className="text-sm font-bold text-foreground">
                {t.teaser.provenance.builtFrom}{" "}
                <span className="text-[#e6b800]">{t.teaser.provenance.yearsHighlight}</span>{" "}
                {t.teaser.provenance.realLifeData}
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

        {/* 3. DARTH claim block */}
        {usesDarth && darthPayload && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <div className="rounded-xl border border-[#e6b800]/45 bg-[radial-gradient(circle_at_top_left,rgba(230,184,0,0.12),transparent_38%),rgba(230,184,0,0.035)] p-6 mb-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block h-2 w-2 rounded-full shrink-0 bg-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {darthPayload.state?.replaceAll("_", " ")}
                </span>
                <span className="rounded-full border border-[#e6b800]/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#e6b800]">
                  {Math.round((darthPayload.confidence ?? 0) * 100)}% {t.teaser.confidence}
                </span>
              </div>
              <p className="text-xl font-semibold text-foreground leading-snug mb-2">
                {darthPayload.explanation}
              </p>
              <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Trajectory
                  </p>
                  <p className="text-[11px] text-muted-foreground/75 font-mono leading-relaxed">
                    {darthPayload.trajectory?.window} | {darthPayload.trajectory?.direction} |{" "}
                    {Math.round((darthPayload.trajectory?.confidence ?? 0) * 100)}% confidence
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/30 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Dominant signal
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {darthPayload.dominant_signal}
                  </p>
                </div>
              </div>
              {darthPayload.conflicting_signal && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {darthPayload.conflicting_signal}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {!usesDarthTeaser && !usesDarth && engineInsights.length > 0 && (
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
                      {t.portal.insightsPage.pillar[hero.pillar as keyof typeof t.portal.insightsPage.pillar] ?? hero.pillar}
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
                      {t.teaser.insights.hrvExplanation}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/40 mt-3 pt-3 border-t border-border/20">
                    {t.teaser.insights.basedOnPatterns}
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
                          {t.portal.insightsPage.pillar[ins.pillar as keyof typeof t.portal.insightsPage.pillar] ?? ins.pillar}
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
                          {t.teaser.insights.hrvExplanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* 4. PROOF — evidence charts only, bound directly to DARTH reasoning */}
        {usesDarth && topEvidenceCharts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#e6b800]">
                PROOF
              </p>
              {darthPayload?.evidence && (
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {Math.round(darthPayload.evidence.confidence_adjusted * 100)}% adjusted confidence
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {topEvidenceCharts.map((chart) => (
                <div key={chart.id} className="flex flex-col gap-1.5">
                  {renderDarthProofChartCard(chart)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {usesDarth && darthPayload?.consequence && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#e6b800]/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#e6b800]">
                Consequence
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {darthPayload.consequence.scope.replaceAll("_", " ")} · {darthPayload.consequence.severity}
              </span>
            </div>
            <p className="text-base font-semibold leading-snug text-foreground">
              {darthPayload.consequence.summary}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {darthPayload.consequence.if_pattern_continues}
            </p>
          </motion.div>
        )}

        {usesDarth && darthPayload?.guidance && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 rounded-xl border border-[#e6b800]/35 bg-[#e6b800]/[0.035] p-5"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#e6b800]/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#e6b800]">
                Action
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {darthPayload.guidance.risk_type.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-base font-semibold leading-snug text-foreground">
              {darthPayload.guidance.statement}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {darthPayload.guidance.recommended_adjustment}
            </p>
          </motion.div>
        )}

        {usesDarth && darthSupporting.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 grid gap-3 sm:grid-cols-3"
          >
            {darthSupporting.slice(0, 3).map(({ block, copy }) =>
              copy ? (
                <div
                  key={block.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0 bg-accent" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.portal.insightsPage.pillar[
                        block.domain as keyof typeof t.portal.insightsPage.pillar
                      ] ?? block.domain}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug mb-1">
                    {copy.action}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {copy.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono leading-relaxed">
                    {copy.evidence}
                  </p>
                </div>
              ) : null
            )}
          </motion.div>
        )}

        {!usesDarthTeaser && !usesDarth && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
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
                        label={last7DRange ? `${t.teaser.charts.sleepStages} · ${last7DRange}` : t.teaser.charts.sleepStages}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {t.teaser.charts.sleepStages}
                        </p>
                        <ChartEmptyState
                          height={200}
                          title={t.teaser.empty.sleep.title}
                          message={t.teaser.empty.sleep.message}
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
                        label={last7DRange ? `${t.teaser.charts.recovery} · ${last7DRange}` : t.teaser.charts.recovery}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {t.teaser.charts.recovery}
                        </p>
                        <ChartEmptyState
                          height={200}
                          title={t.teaser.empty.recovery.title}
                          message={t.teaser.empty.recovery.message}
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
                        label={last7DRange ? `${t.teaser.charts.energy} · ${last7DRange}` : t.teaser.charts.energy}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {t.teaser.charts.energy}
                        </p>
                        <ChartEmptyState
                          height={200}
                          title={t.teaser.empty.energy.title}
                          message={t.teaser.empty.energy.message}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
            </div>
          </motion.div>
        )}

        {/* 5. Preview insight (before CTA) */}
        {!usesDarthTeaser && !usesDarth && previewInsight && (
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

        {!usesDarthTeaser && !usesDarth && <div className="hidden md:block">

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
        </div>}

        {/* ============================================================= */}
        {/* MOBILE LAYOUT — stacked scrollable cards                       */}
        {/* ============================================================= */}
        {!usesDarthTeaser && !usesDarth && <div className="md:hidden space-y-6">

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
        </div>}

        {/* ============================================================= */}
        {/* Full Report CTA — hidden when embedded in portal               */}
        {/* ============================================================= */}
        {!embedded && !usesDarthTeaser && (
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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  trackPremiumCtaClicked("bottom");
                  onOpenModal?.();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e6b800] text-[#1a1a1a] text-sm font-medium shadow-sm transition-colors duration-200 hover:bg-[#f2c94c] active:bg-[#c99a00]"
              >
                <Crown className="h-4 w-4" />
                {darthTeaser?.cta ?? darthCta ?? t.result.preview.fullReport.downloadButton}
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
