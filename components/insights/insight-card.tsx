/**
 * InsightCard — Reusable insight card component
 *
 * Each card shows: title, explanation, optional mini chart, optional CTA.
 * Visually calm, premium styling aligned with Engage7 brand.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import type { InsightText } from "@/lib/insights";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

interface InsightCardProps {
  /** Card title (e.g. "Sleep", "Recovery", "Activity") */
  title: string;
  /** Icon element displayed next to the title */
  icon?: ReactNode;
  /** Extracted insight texts to display */
  insights: InsightText[];
  /** Optional chart element */
  chart?: ReactNode;
  /** Optional CTA label */
  ctaLabel?: string;
  /** CTA click handler */
  onCtaClick?: () => void;
  /** Whether this is the compact "mini" variant used in the lower zone */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export function InsightCard({
  title,
  icon,
  insights,
  chart,
  ctaLabel,
  onCtaClick,
  compact = false,
  className = "",
}: InsightCardProps) {
  const { t } = useLocale();
  return (
    <motion.div
      {...fadeIn}
      className={`h-full flex flex-col rounded-xl border border-border bg-card transition-shadow hover:shadow-md ${
        compact ? "p-4" : "p-5 sm:p-6"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-accent">{icon}</span>}
        <h3
          className={`font-semibold text-foreground ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {title}
        </h3>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className={`space-y-2 ${compact ? "mb-3" : "mb-4"}`}>
          {insights.map((insight, i) => (
            <div key={`insight-${insight.headline.slice(0, 20)}-${i}`}>
              <div className="flex items-start gap-2">
                {/* Priority indicator (Sprint 17.0) */}
                {!compact && insight.priority && (
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      insight.priority === "high"
                        ? "bg-amber-500"
                        : insight.priority === "medium"
                        ? "bg-blue-400"
                        : "bg-gray-400"
                    }`}
                  />
                )}
                <p
                  className={`font-medium text-foreground ${
                    compact ? "text-xs" : "text-sm"
                  }`}
                >
                  {insight.headline}
                </p>
              </div>
              {!compact && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.body}
                </p>
              )}
              {!compact && insight.meaning && (
                <p className="text-xs text-muted-foreground/80 mt-0.5 italic leading-relaxed">
                  {insight.meaning}
                </p>
              )}
              {/* Action hint (Sprint 17.0) */}
              {!compact && insight.action && (
                <p className="text-xs text-accent/90 mt-1 leading-relaxed font-medium">
                  → {insight.action}
                </p>
              )}
              {/* Benchmark message (Sprint 17.0) */}
              {!compact && insight.benchmark && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                  {insight.benchmark}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {insights.length === 0 && (
        <p
          className={`text-muted-foreground ${
            compact ? "text-xs mb-3" : "text-sm mb-4"
          }`}
        >
          {t.result.preview.emptyInsights}
        </p>
      )}

      {/* Chart - grows to fill available space */}
      {chart && (
        <div className={`flex-grow ${compact ? "mb-3" : "mb-4"}`}>{chart}</div>
      )}

      {/* CTA */}
      {ctaLabel && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors mt-auto"
        >
          {ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
