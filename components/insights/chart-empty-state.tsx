/**
 * ChartEmptyState — Sprint 25.9
 *
 * Premium empty/partial state placeholder for chart card slots.
 * Keeps the card footprint stable when metric data is absent.
 *
 * Design rules:
 * - Same height as the chart it replaces
 * - Muted, calm, intentional — not an error screen
 * - Short copy only — no overexplaining
 */

"use client";

interface ChartEmptyStateProps {
  /** Must match the height passed to the chart it replaces */
  height?: number;
  /** Short heading — 3–5 words, calm tone */
  title: string;
  /** 1–2 sentence explanation — premium, non-alarmist */
  message: string;
}

export function ChartEmptyState({
  height = 200,
  title,
  message,
}: Readonly<ChartEmptyStateProps>) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/25 bg-muted/[0.03]"
      style={{ height: `${height}px` }}
    >
      {/* Faint grid scaffold — gives chart-like visual weight without fake data */}
      <svg
        className="absolute opacity-[0.04] pointer-events-none"
        width="80"
        height="48"
        viewBox="0 0 80 48"
        fill="none"
        aria-hidden="true"
      >
        <line x1="0" y1="12" x2="80" y2="12" stroke="currentColor" strokeDasharray="4 4" />
        <line x1="0" y1="24" x2="80" y2="24" stroke="currentColor" strokeDasharray="4 4" />
        <line x1="0" y1="36" x2="80" y2="36" stroke="currentColor" strokeDasharray="4 4" />
        <line x1="20" y1="0" x2="20" y2="48" stroke="currentColor" strokeDasharray="4 4" />
        <line x1="40" y1="0" x2="40" y2="48" stroke="currentColor" strokeDasharray="4 4" />
        <line x1="60" y1="0" x2="60" y2="48" stroke="currentColor" strokeDasharray="4 4" />
      </svg>
      <p className="relative text-[11px] font-semibold text-muted-foreground/50 text-center px-6 leading-snug">
        {title}
      </p>
      <p className="relative text-[10px] text-muted-foreground/35 text-center px-6 leading-relaxed max-w-[200px]">
        {message}
      </p>
    </div>
  );
}
