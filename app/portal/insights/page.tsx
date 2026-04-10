"use client";

import {
  extractActivityInsights,
  extractRecoveryInsights,
  extractSleepInsights,
  type InsightText,
} from "@/lib/insights/extract";
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

interface Analysis {
  sections?: Sections;
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

const CONFIDENCE_EXPLANATIONS: Record<"high" | "medium" | "low", string> = {
  high: "Strong pattern detected with consistent data",
  medium: "Some pattern detected, but with moderate confidence",
  low: "Limited data or weak pattern",
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

function getSignalLabel(pillar: string | undefined): string {
  if (pillar === "sleep") return "Sleep duration";
  if (pillar === "recovery") return "HRV / Heart rate";
  if (pillar === "activity") return "Steps / Active minutes";
  return "Health signals";
}

function InsightCard({
  insight,
  sparkData,
}: {
  insight: InsightText;
  sparkData: number[];
}) {
  const confidence = priorityToConfidence(insight.priority);
  const trend = trendFromScore(insight.score);
  const color = PILLAR_COLOR[insight.pillar ?? "sleep"] ?? "#3dbe73";
  const icon = PILLAR_ICON[insight.pillar ?? "sleep"];

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
        <p className="text-xs text-accent/80 italic">→ {insight.action}</p>
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
              Last {sparkData.length} data points
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${CONFIDENCE_COLORS[confidence]}`}
          >
            {confidence} confidence
          </span>
          {insight.pillar && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {icon}
              {insight.pillar}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {CONFIDENCE_EXPLANATIONS[confidence]}
        </p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightText[]>([]);
  const [trends, setTrends] = useState<TrendsData["trends"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/proxy/users/portal-analyses").then((r) => r.json()),
      fetch("/api/proxy/users/portal-trends")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([analysesData, trendsData]) => {
        // Trends
        if (trendsData?.trends) {
          setTrends(trendsData.trends);
        }

        // Insights
        const analyses: Analysis[] = analysesData.analyses ?? [];
        if (analyses.length === 0) {
          setEmpty(true);
          setLoading(false);
          return;
        }

        const latest = analyses.find((a) => a.sections) ?? analyses[0];
        const sections = latest?.sections ?? null;

        const all = [
          ...extractSleepInsights(sections),
          ...extractRecoveryInsights(sections),
          ...extractActivityInsights(sections),
        ];

        all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

        setInsights(all);
        setLoading(false);
      })
      .catch(() => {
        setEmpty(true);
        setLoading(false);
      });
  }, []);

  // Memoize sparkline data for each pillar
  const sparklines = useMemo(() => {
    return {
      sleep: getSparklineData("sleep", trends),
      recovery: getSparklineData("recovery", trends),
      activity: getSparklineData("activity", trends),
    };
  }, [trends]);

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
          <InsightCard
            key={`${insight.pillar}-${i}`}
            insight={insight}
            sparkData={
              sparklines[insight.pillar as keyof typeof sparklines] ?? []
            }
          />
        ))}
      </div>
    </div>
  );
}
