"use client";

import { useLocale } from "@/components/providers/locale-provider";
import type {
  CompareImproveResult,
  CompareItem,
  ImproveItem,
  InterpretItem,
} from "@/lib/insights/compare-improve";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: CompareItem["status"] }) {
  switch (status) {
    case "good":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "attention":
      return <ArrowDownRight className="h-4 w-4 text-amber-500" />;
    default:
      return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
  }
}

function CompareSection({
  items,
  title,
  rangeLabel,
}: {
  items: CompareItem[];
  title: string;
  rangeLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Scale className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5"
          >
            <StatusIcon status={item.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-card-foreground">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.userValue} · {rangeLabel} {item.referenceRange}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterpretSection({
  items,
  title,
}: {
  items: InterpretItem[];
  title: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-card-foreground">
          {title}
        </h3>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.headline}
            className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-card-foreground">
              {item.headline}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImproveSection({
  items,
  title,
}: {
  items: ImproveItem[];
  title: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.suggestion}
            className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-card-foreground">
              {item.suggestion}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

export function CompareImproveBlock({
  result,
}: {
  result: CompareImproveResult | null | undefined;
}) {
  const { t } = useLocale();
  if (!result?.hasData) return null;

  const comparisons = Array.isArray(result.comparisons)
    ? result.comparisons
    : [];
  const interpretations = Array.isArray(result.interpretations)
    ? result.interpretations
    : [];
  const improvements = Array.isArray(result.improvements)
    ? result.improvements
    : [];

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-card-foreground">
          {t.portal.compareImprove.title}
        </h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <CompareSection
          items={comparisons}
          title={t.portal.compareImprove.compare}
          rangeLabel={t.portal.compareImprove.range}
        />
        <InterpretSection
          items={interpretations}
          title={t.portal.compareImprove.interpret}
        />
        <ImproveSection
          items={improvements}
          title={t.portal.compareImprove.improve}
        />
      </div>
    </div>
  );
}
