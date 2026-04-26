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

import {
  type DarthPayload,
  getDarthPayload,
} from "@/lib/darth";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Brain,
  CheckCircle2,
  Zap,
} from "lucide-react";
import React from "react";

// ---------------------------------------------------------------------------
// State metadata
// ---------------------------------------------------------------------------

interface StateConfig {
  label: string;
  color: string;           // tailwind bg
  textColor: string;       // tailwind text
  border: string;          // tailwind border
  Icon: React.ElementType;
}

const STATE_CONFIG: Record<string, StateConfig> = {
  RECOVERING: {
    label: "Recovering",
    color: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    border: "border-emerald-500/20",
    Icon: CheckCircle2,
  },
  STABLE: {
    label: "Stable",
    color: "bg-blue-500/10",
    textColor: "text-blue-400",
    border: "border-blue-500/20",
    Icon: CheckCircle2,
  },
  STRAIN_ACCUMULATING: {
    label: "Strain Accumulating",
    color: "bg-amber-500/10",
    textColor: "text-amber-400",
    border: "border-amber-500/20",
    Icon: Zap,
  },
  OVERREACHED: {
    label: "Overreached",
    color: "bg-red-500/10",
    textColor: "text-red-400",
    border: "border-red-500/20",
    Icon: AlertTriangle,
  },
  MISALIGNED_RECOVERY: {
    label: "Misaligned Recovery",
    color: "bg-purple-500/10",
    textColor: "text-purple-400",
    border: "border-purple-500/20",
    Icon: Brain,
  },
};

const DEFAULT_STATE: StateConfig = {
  label: "Processing",
  color: "bg-muted",
  textColor: "text-muted-foreground",
  border: "border-border",
  Icon: Brain,
};

// ---------------------------------------------------------------------------
// Trajectory badge
// ---------------------------------------------------------------------------

function TrajectoryBadge({
  direction,
  confidence,
}: {
  direction: string;
  confidence: number;
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
      <span className="capitalize text-card-foreground">{direction}</span>
      <span className="text-muted-foreground">· {pct}%</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DarthStatePanelProps {
  /** Latest analysis sections JSON — pass null when loading */
  sections: unknown;
}

export function DarthStatePanel({ sections }: DarthStatePanelProps) {
  const payload: DarthPayload | null = getDarthPayload(sections);

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

  const cfg = state ? (STATE_CONFIG[state] ?? DEFAULT_STATE) : DEFAULT_STATE;
  const { Icon } = cfg;

  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.color} px-5 py-4 flex flex-col gap-3`}
    >
      {/* Header row: state badge + trajectory */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border ${cfg.border} bg-background/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${cfg.textColor}`}
        >
          <Icon className={`h-3 w-3 ${cfg.textColor}`} />
          {cfg.label}
        </span>

        {trajectory && (
          <TrajectoryBadge
            direction={trajectory.direction}
            confidence={trajectory.confidence}
          />
        )}

        {confidence != null && (
          <span className="text-xs text-muted-foreground ml-auto">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Primary claim */}
      {primary_claim && (
        <p className="text-sm font-medium text-card-foreground leading-relaxed">
          {primary_claim}
        </p>
      )}

      {/* Baseline context */}
      {baseline_context && (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-card-foreground/70">
            {baseline_context.headline}
          </p>
          {baseline_context.explanation && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {baseline_context.explanation}
            </p>
          )}
        </div>
      )}

      {/* Consequence */}
      {consequence?.summary && (
        <p className="text-xs text-muted-foreground border-l-2 border-muted pl-3 italic">
          {consequence.summary}
        </p>
      )}

      {/* Guidance action */}
      {guidance?.recommended_adjustment && (
        <div className="flex items-start gap-2">
          <ArrowRight className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.textColor}`} />
          <p className="text-xs text-card-foreground/80">
            {guidance.recommended_adjustment}
          </p>
        </div>
      )}

      {/* Conflict warning */}
      {conflict?.exists && conflict.explanation && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 mt-1">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            {conflict.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
