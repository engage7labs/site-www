"use client";

import {
  extractActivityInsights,
  extractRecoveryInsights,
  extractSleepInsights,
  type InsightText,
} from "@/lib/insights/extract";
import {
  Lightbulb,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sections = Record<string, any>;

interface Analysis {
  sections?: Sections;
}

const CONFIDENCE_COLORS = {
  high: "bg-accent/10 text-accent",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-muted text-muted-foreground",
};

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

function InsightCard({ insight }: { insight: InsightText }) {
  const confidence = priorityToConfidence(insight.priority);
  const trend = trendFromScore(insight.score);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">
            {insight.headline}
          </h3>
        </div>
        <TrendIcon trend={trend} />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {insight.body}
      </p>
      {insight.action && (
        <p className="text-xs text-accent/80 italic">{insight.action}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${CONFIDENCE_COLORS[confidence]}`}
        >
          {confidence} confidence
        </span>
        {insight.pillar && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {insight.pillar}
          </span>
        )}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightText[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    fetch("/api/proxy/users/portal-analyses")
      .then((r) => r.json())
      .then((data) => {
        const analyses: Analysis[] = data.analyses ?? [];
        if (analyses.length === 0) {
          setEmpty(true);
          setLoading(false);
          return;
        }

        // Use the most recent analysis with sections data
        const latest = analyses.find((a) => a.sections) ?? analyses[0];
        const sections = latest?.sections ?? null;

        const all = [
          ...extractSleepInsights(sections),
          ...extractRecoveryInsights(sections),
          ...extractActivityInsights(sections),
        ];

        // Sort by score descending
        all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

        setInsights(all);
        setLoading(false);
      })
      .catch(() => {
        setEmpty(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (empty || insights.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground max-w-sm">
            No insights yet. Upload your health data to start seeing patterns
            and recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {insights.map((insight, i) => (
          <InsightCard key={`${insight.pillar}-${i}`} insight={insight} />
        ))}
      </div>
    </div>
  );
}
