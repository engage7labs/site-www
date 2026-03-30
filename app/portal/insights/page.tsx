import { Lightbulb, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal — Insights",
};

interface Insight {
  id: string;
  title: string;
  confidence: "high" | "medium" | "low";
  trend: "up" | "down" | "flat";
  explanation: string;
}

const PLACEHOLDER_INSIGHTS: Insight[] = [
  {
    id: "i-1",
    title: "Sleep consistency improving",
    confidence: "high",
    trend: "up",
    explanation:
      "Your bedtime variance decreased from ±48 min to ±22 min over the past two weeks. Consistent sleep timing is strongly associated with better recovery scores.",
  },
  {
    id: "i-2",
    title: "Resting heart rate trending lower",
    confidence: "medium",
    trend: "up",
    explanation:
      "Your average resting HR dropped from 62 to 58 bpm over the last 30 days. This often correlates with improved cardiovascular fitness.",
  },
  {
    id: "i-3",
    title: "Activity dip on weekends",
    confidence: "high",
    trend: "down",
    explanation:
      "Weekend active minutes average 18 min vs 42 min on weekdays. Even a short walk can help maintain consistency.",
  },
  {
    id: "i-4",
    title: "HRV stable but flat",
    confidence: "low",
    trend: "flat",
    explanation:
      "Your HRV has remained in the 40–48 ms range for 3 weeks. This is not concerning but may indicate a plateau in recovery adaptation.",
  },
];

const CONFIDENCE_COLORS = {
  high: "bg-accent/10 text-accent",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-muted text-muted-foreground",
};

function TrendIcon({ trend }: { trend: Insight["trend"] }) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-accent" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    case "flat":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Patterns detected from your data — based on your own history, not
          averages
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLACEHOLDER_INSIGHTS.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-card-foreground">
                  {insight.title}
                </h3>
              </div>
              <TrendIcon trend={insight.trend} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {insight.explanation}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  CONFIDENCE_COLORS[insight.confidence]
                }`}
              >
                {insight.confidence} confidence
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
