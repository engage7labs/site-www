/**
 * DarthStatePanel — Sprint 32.0
 *
 * Renders the DARTH semantic health state above longitudinal charts.
 * Consumes DarthPayload from sections_json (extracted client-side).
 *
 * Shows:
 *  - State badge (RECOVERING / STABLE / STRAIN_ACCUMULATING / etc.)
 *  - Primary claim (narrative sentence)
 *  - Trajectory (direction + confidence)
 *  - Baseline context headline
 *  - Guidance action (recommended_adjustment)
 *  - Consequence summary
 *  - Conflict warning (if darth.conflict.exists)
 */
"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { FeaturePreviewBadge } from "@/components/shared/feature-preview-badge";
import {
  displayDarthTrajectoryLabel,
  humanizeDarthTechnicalText,
  type DarthPayload,
  getDarthPayload,
  selectDarthStatePresentation,
} from "@/lib/darth";
import {
  canonicalAiReflectionLocale,
  extractAiNarrativeViewModel,
  extractAiReflectionMetadata,
  type AiNarrative,
  type AiReflectionMetadata,
  type AiValidationStatus,
  isCurrentAiReflection,
  isRenderableAiReflection,
} from "@/lib/ai-reflections";
import { usePreviewFeatures } from "@/lib/feature-preview";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Brain,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// State metadata
// ---------------------------------------------------------------------------

interface StateConfig {
  label: string;
  color: string; // tailwind bg
  textColor: string; // tailwind text
  border: string; // tailwind border
  Icon: React.ElementType;
}

const STATE_CONFIG: Record<string, StateConfig> = {
  RECOVERING: {
    label: "Readiness rebuilding",
    color: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    border: "border-emerald-500/20",
    Icon: CheckCircle2,
  },
  STABLE: {
    label: "Stable active-life pattern",
    color: "bg-blue-500/10",
    textColor: "text-blue-400",
    border: "border-blue-500/20",
    Icon: CheckCircle2,
  },
  STRAIN_ACCUMULATING: {
    label: "Load accumulating",
    color: "bg-amber-500/10",
    textColor: "text-amber-400",
    border: "border-amber-500/20",
    Icon: Zap,
  },
  OVERREACHED: {
    label: "Load above recovery",
    color: "bg-red-500/10",
    textColor: "text-red-400",
    border: "border-red-500/20",
    Icon: AlertTriangle,
  },
  MISALIGNED_RECOVERY: {
    label: "Load and recovery not aligned",
    color: "bg-purple-500/10",
    textColor: "text-purple-400",
    border: "border-purple-500/20",
    Icon: Brain,
  },
};

const FALLBACK_STATE_LABELS: Record<string, string> = {
  RECOVERING: "Readiness rebuilding",
  STABLE: "Stable active-life pattern",
  STRAIN_ACCUMULATING: "Load accumulating",
  OVERREACHED: "Load above recovery",
  MISALIGNED_RECOVERY: "Load and recovery not aligned",
};

const DEFAULT_STATE: StateConfig = {
  label: "Processing",
  color: "bg-muted",
  textColor: "text-muted-foreground",
  border: "border-border",
  Icon: Brain,
};

const AI_FEATURE_KEY = "ai_darth_health_overview_narrative";

type AiStatus = "idle" | "loading" | "success" | "error";

function aiErrorCode(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "code" in detail) {
    const code = (detail as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "provider_failure";
}

// ---------------------------------------------------------------------------
// Trajectory badge
// ---------------------------------------------------------------------------

function TrajectoryBadge({
  direction,
  directionLabel,
  confidence,
  confidenceLabel,
}: {
  direction: string;
  directionLabel: string;
  confidence: number;
  confidenceLabel: string;
}) {
  const pct = Math.round(confidence * 100);
  const Icon =
    direction === "improving"
      ? ArrowUp
      : direction === "deteriorating"
      ? ArrowDown
      : ArrowRight;

  const color =
    direction === "improving"
      ? "text-emerald-400"
      : direction === "deteriorating"
      ? "text-red-400"
      : "text-muted-foreground";

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium">
      <Icon className={`h-3 w-3 ${color}`} />
      <span className="text-card-foreground">{directionLabel}</span>
      <span className="text-muted-foreground">
        · {pct}% {confidenceLabel}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DarthStatePanelProps {
  /** Latest analysis sections JSON — pass null when loading */
  sections: unknown;
  currentAnalysisId?: string | null;
}

export function DarthStatePanel({ sections, currentAnalysisId = null }: DarthStatePanelProps) {
  const { locale, t } = useLocale();
  const { isEnabled, loading: featureLoading } = usePreviewFeatures();
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiNarrative, setAiNarrative] = useState<AiNarrative | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiValidationStatus, setAiValidationStatus] =
    useState<AiValidationStatus | null>(null);
  const [aiWarningCodes, setAiWarningCodes] = useState<string[]>([]);
  const [aiMetadata, setAiMetadata] = useState<AiReflectionMetadata | null>(null);
  const payload: DarthPayload | null = getDarthPayload(sections);
  const evidencePackHash = payload?.evidence_pack?.evidence_pack_hash ?? null;
  const canGenerateAi = isEnabled(AI_FEATURE_KEY);
  const aiReflectionLocale = canonicalAiReflectionLocale(locale);

  useEffect(() => {
    setAiStatus("idle");
    setAiNarrative(null);
    setAiError(null);
    setAiValidationStatus(null);
    setAiWarningCodes([]);
    setAiMetadata(null);
  }, [aiReflectionLocale, evidencePackHash, currentAnalysisId]);

  useEffect(() => {
    if (
      featureLoading ||
      !canGenerateAi ||
      !currentAnalysisId ||
      !evidencePackHash
    ) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      analysis_id: currentAnalysisId,
      input_evidence_pack_hash: evidencePackHash,
      locale: aiReflectionLocale,
    });

    (async () => {
      try {
        const res = await fetch(
          `/api/proxy/ai/health-overview-narrative/current?${params.toString()}`,
        );
        const data = (await res.json().catch(() => null)) as {
          artifact?: {
            artifact_id?: number;
            feature_key?: string;
            analysis_id?: string | null;
            input_evidence_pack_hash?: string | null;
            locale?: string;
            validation_status?: AiValidationStatus;
            validation_warnings?: string[];
            validation_errors?: string[];
            narrative?: unknown;
          } | null;
        } | null;
        if (cancelled) return;
        const artifact = data?.artifact;
        const narrative = extractAiNarrativeViewModel(artifact ?? null);
        if (!res.ok || !artifact || !narrative) {
          return;
        }
        const metadata = extractAiReflectionMetadata(artifact);
        setAiNarrative(narrative);
        setAiValidationStatus(metadata?.validation_status ?? "passed");
        setAiWarningCodes(metadata?.validation_warnings ?? []);
        setAiMetadata(metadata);
        setAiStatus("success");
      } catch {
        if (!cancelled) {
          setAiStatus("idle");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [aiReflectionLocale, canGenerateAi, currentAnalysisId, evidencePackHash, featureLoading]);

  if (!payload) return null;
  const {
    state,
    primary_claim,
    trajectory,
    baseline_context,
    guidance,
    consequence,
    conflict,
    confidence,
  } = payload;

  const display = selectDarthStatePresentation(payload, locale);
  const cfg = state ? STATE_CONFIG[state] ?? DEFAULT_STATE : DEFAULT_STATE;
  const { Icon } = cfg;
  const aiCopy = t.portal.health.ai;
  const aiErrorMessage = aiError
    ? aiCopy.errors[aiError as keyof typeof aiCopy.errors] ?? aiCopy.errors.provider_failure
    : null;
  const aiContext = {
    featureKey: AI_FEATURE_KEY,
    analysisId: currentAnalysisId,
    evidencePackHash,
    locale: aiReflectionLocale,
  };
  const canRenderAiNarrative = Boolean(
    aiNarrative &&
      isCurrentAiReflection(aiMetadata, aiContext) &&
      isRenderableAiReflection(aiMetadata),
  );
  const canRenderAiFallback = Boolean(
    aiNarrative &&
      isCurrentAiReflection(aiMetadata, aiContext) &&
      aiValidationStatus === "blocked",
  );

  if (featureLoading) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/85 px-5 py-4">
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  async function generateAiNarrative() {
    setAiStatus("loading");
    setAiError(null);
    setAiValidationStatus(null);
    setAiWarningCodes([]);
    setAiMetadata(null);
    try {
      const res = await fetch("/api/proxy/ai/health-overview-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: aiReflectionLocale,
          ...(currentAnalysisId ? { analysis_id: currentAnalysisId } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        narrative?: AiNarrative | null;
        fallback_narrative?: AiNarrative;
        validation_status?: AiValidationStatus;
        validation_errors?: string[];
        validation_warnings?: string[];
        metadata?: {
          feature_key?: string;
          analysis_id?: string | null;
          input_evidence_pack_hash?: string | null;
          locale?: string;
          validation_status?: AiValidationStatus;
          validation_errors?: string[];
          validation_warnings?: string[];
        };
        detail?: unknown;
      } | null;
      if (!res.ok) {
        const code = aiErrorCode(data?.detail);
        const fallback =
          data?.detail &&
          typeof data.detail === "object" &&
          "narrative" in data.detail
            ? (data.detail as { narrative?: AiNarrative }).narrative
            : null;
        setAiNarrative(fallback ?? null);
        setAiError(code);
        setAiValidationStatus("blocked");
        setAiMetadata(extractAiReflectionMetadata(data));
        setAiStatus("error");
        return;
      }
      const validationStatus =
        data?.validation_status ??
        data?.metadata?.validation_status ??
        "passed";
      const validationErrors =
        data?.validation_errors ?? data?.metadata?.validation_errors ?? [];
      const validationWarnings =
        data?.validation_warnings ?? data?.metadata?.validation_warnings ?? [];
      if (validationStatus === "blocked") {
        setAiNarrative(data?.fallback_narrative ?? null);
        setAiError(validationErrors[0] ?? "validation_failed");
        setAiValidationStatus("blocked");
        setAiWarningCodes(validationWarnings);
        setAiMetadata(extractAiReflectionMetadata(data));
        setAiStatus("error");
        return;
      }
      const narrative = extractAiNarrativeViewModel(data);
      if (!narrative) {
        setAiNarrative(null);
        setAiError("validation_failed");
        setAiValidationStatus("blocked");
        setAiStatus("error");
        return;
      }
      const metadata = extractAiReflectionMetadata(data);
      setAiNarrative(narrative);
      setAiValidationStatus(validationStatus);
      setAiWarningCodes(validationWarnings);
      setAiMetadata(metadata);
      setAiStatus("success");
    } catch {
      setAiNarrative(null);
      setAiError("provider_failure");
      setAiValidationStatus("blocked");
      setAiMetadata(null);
      setAiStatus("error");
    }
  }

  return (
    <div
      className={
        canGenerateAi
          ? "rounded-xl border border-accent/25 bg-card/85 px-5 py-4 flex flex-col gap-3"
          : `rounded-xl border ${cfg.border} ${cfg.color} px-5 py-4 flex flex-col gap-3`
      }
    >
      {/* Header row: state badge + trajectory */}
      {!canGenerateAi && <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border ${cfg.border} bg-background/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${cfg.textColor}`}
        >
          <Icon className={`h-3 w-3 ${cfg.textColor}`} />
          {display?.state_label ??
            (state ? FALLBACK_STATE_LABELS[state] : cfg.label) ??
            cfg.label}
        </span>

        <FeaturePreviewBadge />

        {trajectory && (
          <TrajectoryBadge
            direction={trajectory.direction}
            directionLabel={
              display?.trajectory?.direction_label ??
              displayDarthTrajectoryLabel(trajectory.direction, locale) ??
              trajectory.direction.replaceAll("_", " ")
            }
            confidence={trajectory.confidence}
            confidenceLabel={
              display?.trajectory?.confidence_label ?? "confidence"
            }
          />
        )}

        {confidence != null && (
          <span className="text-xs text-muted-foreground ml-auto">
            {Math.round(confidence * 100)}%{" "}
            {display?.confidence_label ?? "confidence"}
          </span>
        )}
      </div>}

      {/* Primary claim */}
      {!canGenerateAi && primary_claim && (
        <p className="text-sm font-medium text-card-foreground leading-relaxed">
          {display?.primary_claim ??
            humanizeDarthTechnicalText(primary_claim, locale) ??
            primary_claim}
        </p>
      )}

      {/* Baseline context */}
      {!canGenerateAi && baseline_context && (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-card-foreground/70">
            {display?.baseline_context?.headline ??
              humanizeDarthTechnicalText(baseline_context.headline, locale) ??
              baseline_context.headline}
          </p>
          {baseline_context.explanation && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {display?.baseline_context?.explanation ??
                humanizeDarthTechnicalText(baseline_context.explanation, locale) ??
                baseline_context.explanation}
            </p>
          )}
        </div>
      )}

      {/* Consequence */}
      {!canGenerateAi && consequence?.summary && (
        <p className="text-xs text-muted-foreground border-l-2 border-muted pl-3 italic">
          {display?.consequence?.summary ??
            humanizeDarthTechnicalText(consequence.summary, locale) ??
            consequence.summary}
        </p>
      )}

      {/* Guidance action */}
      {!canGenerateAi && guidance?.recommended_adjustment && (
        <div className="flex items-start gap-2">
          <ArrowRight
            className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.textColor}`}
          />
          <p className="text-xs text-card-foreground/80">
            {display?.guidance?.recommended_adjustment ??
              humanizeDarthTechnicalText(guidance.recommended_adjustment, locale) ??
              guidance.recommended_adjustment}
          </p>
        </div>
      )}

      {/* Conflict warning */}
      {!canGenerateAi && conflict?.exists && conflict.explanation && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 mt-1">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            {display?.conflict?.explanation ??
              humanizeDarthTechnicalText(conflict.explanation, locale) ??
              conflict.explanation}
          </p>
        </div>
      )}

      {canGenerateAi && (
        <div className={canGenerateAi ? "" : "mt-2 border-t border-border/60 pt-3"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-card-foreground">
                  {aiCopy.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {aiCopy.subtitle}
                </p>
              </div>
            </div>
            {!canRenderAiNarrative && !canRenderAiFallback && (
              <button
                type="button"
                onClick={generateAiNarrative}
                disabled={aiStatus === "loading"}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-accent/35 bg-accent/10 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/15 disabled:pointer-events-none disabled:opacity-60"
              >
                {aiStatus === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {aiStatus === "loading" ? aiCopy.generating : aiCopy.generate}
              </button>
            )}
          </div>

          {aiErrorMessage && (
            <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {aiErrorMessage}
            </p>
          )}

          {(canRenderAiNarrative || canRenderAiFallback) && aiNarrative && (
            <div className="mt-3 rounded-lg border border-border/70 bg-background/35 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {aiCopy.badge}
                </span>
                <p className="text-sm font-semibold text-card-foreground">
                  {aiNarrative.headline}
                </p>
              </div>
              {aiValidationStatus === "warning" && (
                <div className="mb-3 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs font-medium text-amber-200">
                        {aiCopy.previewWarning}
                      </p>
                      {aiWarningCodes.length > 0 && (
                        <p className="mt-1 text-[11px] text-amber-100/70">
                          {aiCopy.warningCodes}: {aiWarningCodes.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {aiCopy.interpretation}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-card-foreground/85">
                    {aiNarrative.longitudinal_interpretation}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {aiCopy.whyItMatters}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-card-foreground/85">
                    {aiNarrative.why_it_matters}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <ArrowRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cfg.textColor}`} />
                <p className="text-xs text-card-foreground/85">
                  {aiNarrative.suggested_next_step}
                </p>
              </div>
              {aiNarrative.evidence_used.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiNarrative.evidence_used.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                {aiNarrative.confidence_note}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {aiNarrative.safety_note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
