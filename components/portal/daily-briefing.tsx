/**
 * DailyBriefing — Sprint 19.0
 *
 * Hero card for the portal overview page. Renders a deterministic
 * daily briefing: active window, what to avoid, projection, and
 * light adjustments — all from the user's own data.
 *
 * Language: simple, calm, human. No jargon.
 */

"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BriefingFeedback } from "./briefing-feedback";
import { selectDarthCopy, selectDarthCta, type DarthPresentation } from "@/lib/darth";
import { useLocale } from "@/components/providers/locale-provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Briefing {
  state: "strained" | "recovering" | "stable" | "thriving";
  confidence: number;
  reasons: string[];
  avoid: string[];
  projection: string;
  actions: string[];
}

interface DailyBriefingData {
  briefing: Briefing | null;
  presentation?: DarthPresentation | null;
  narrative_state?: {
    primary_theme: string;
    tone: string;
    direction: string;
    confidence: number;
    supporting_domains: string[];
  } | null;
  reason?: string;
}

// ---------------------------------------------------------------------------
// State presentation
// ---------------------------------------------------------------------------

const STATE_CONFIG: Record<
  Briefing["state"],
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  strained: {
    label: "Strained",
    description: "Your body is signalling it needs extra care in this window.",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50/80 dark:bg-amber-950/30",
    border: "border-amber-200/60 dark:border-amber-800/40",
  },
  recovering: {
    label: "Recovering",
    description: "Your signals are improving — keep it steady.",
    icon: Shield,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/80 dark:bg-blue-950/30",
    border: "border-blue-200/60 dark:border-blue-800/40",
  },
  stable: {
    label: "Stable",
    description: "Everything looks within your normal ranges.",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
  },
  thriving: {
    label: "Thriving",
    description: "Your key signals are above your normal — great window.",
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50/80 dark:bg-violet-950/30",
    border: "border-violet-200/60 dark:border-violet-800/40",
  },
};

// ---------------------------------------------------------------------------
// Benchmark label helper
// ---------------------------------------------------------------------------

function benchmarkLabel(text: string): string {
  return text
    .replace(/\bcorrelation\b/gi, "relationship")
    .replace(/\bbaseline deviation\b/gi, "above/below your normal");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DailyBriefing() {
  const { locale } = useLocale();
  const [data, setData] = useState<DailyBriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proxy/daily-briefing");
        if (res.ok) {
          const json = (await res.json()) as DailyBriefingData;
          setData(json);
        }
      } catch {
        // silent — show nothing
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted/40 rounded" />
        <div className="h-3 w-72 bg-muted/30 rounded mt-3" />
      </div>
    );
  }

  if (!data?.briefing) return null;

  const darthHero = data.presentation?.hero
    ? selectDarthCopy(data.presentation.hero.copy, locale)
    : null;
  const darthSupporting = (data.presentation?.supporting ?? [])
    .map((block) => ({
      block,
      copy: selectDarthCopy(block.copy, locale),
    }))
    .filter((entry) => entry.copy);
  const darthCta = selectDarthCta(data.presentation?.cta, locale);

  if (data.presentation?.hero && darthHero) {
    return (
      <div className="portal-panel rounded-xl border border-accent/20 bg-accent/[0.04] p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-card-foreground">
                {darthHero.title}
              </h2>
              {data.narrative_state && (
                <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                  {Math.round(data.narrative_state.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {darthHero.body}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 px-4 py-3">
          <p className="text-[11px] text-muted-foreground/60 font-mono">
            {darthHero.evidence}
          </p>
        </div>

        {darthSupporting.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Supporting signals
            </h3>
            <div className="space-y-2">
              {darthSupporting.map(({ block, copy }) => (
                <p
                  key={block.id}
                  className="text-sm text-card-foreground/85 flex items-start gap-2"
                >
                  <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/70" />
                  <span>
                    {copy?.body}
                    {copy?.evidence ? ` (${copy.evidence})` : ""}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}

        {darthCta && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Light adjustments
            </h3>
            <p className="text-sm text-card-foreground/85 flex items-start gap-2">
              <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/70" />
              {darthCta}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-border/40">
          <BriefingFeedback
            feedbackType="daily_briefing"
            context={data.narrative_state?.primary_theme ?? "darth"}
          />
        </div>
      </div>
    );
  }

  const b = data.briefing;
  const cfg = STATE_CONFIG[b.state];
  const StateIcon = cfg.icon;

  return (
    <div
      className={`portal-panel rounded-xl border ${cfg.border} ${cfg.bg} p-6 space-y-5`}
    >
      {/* ── Hero: Daily State ──────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.color}`}
        >
          <StateIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-card-foreground">
              Your day looks{" "}
              <span className={cfg.color}>{cfg.label.toLowerCase()}</span>
            </h2>
            <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
              {Math.round(b.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cfg.description}
          </p>
        </div>
      </div>

      {/* ── Reasons ────────────────────────────────────────── */}
      {b.reasons.length > 0 && (
        <div className="space-y-1.5">
          {b.reasons.map((r, i) => (
            <p
              key={`reason-${i}`}
              className="text-sm text-card-foreground/90 flex items-start gap-2"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-40" />
              {benchmarkLabel(r)}
            </p>
          ))}
        </div>
      )}

      {/* ── What to Avoid ──────────────────────────────────── */}
      {b.avoid.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            What to avoid in this window
          </h3>
          <div className="space-y-1.5">
            {b.avoid.map((a, i) => (
              <p
                key={`avoid-${i}`}
                className="text-sm text-card-foreground/85 flex items-start gap-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500/70" />
                {benchmarkLabel(a)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── If This Continues ──────────────────────────────── */}
      {b.projection && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3" />
            If this continues
          </h3>
          <p className="text-sm text-card-foreground/80 leading-relaxed">
            {benchmarkLabel(b.projection)}
          </p>
        </div>
      )}

      {/* ── Light Adjustments ──────────────────────────────── */}
      {b.actions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Light adjustments
          </h3>
          <div className="space-y-1.5">
            {b.actions.map((act, i) => (
              <p
                key={`action-${i}`}
                className="text-sm text-card-foreground/85 flex items-start gap-2"
              >
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent/70" />
                {benchmarkLabel(act)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Feedback ───────────────────────────────────────── */}
      <div className="pt-2 border-t border-border/40">
        <BriefingFeedback feedbackType="daily_briefing" context={b.state} />
      </div>
    </div>
  );
}
