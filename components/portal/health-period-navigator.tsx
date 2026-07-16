"use client";

import { useLocale } from "@/components/providers/locale-provider";
import {
  HEALTH_TIME_RANGE_MODES,
  formatCalendarDate,
  formatHealthPeriodLabel,
  type HealthInclusiveRange,
  type HealthSelectedPeriod,
  type HealthTimeRangeMode,
} from "@/lib/health-time-range";
import { ChevronLeft, ChevronRight, LocateFixed } from "lucide-react";

export function HealthPeriodNavigator({
  selected,
  range,
  canMoveBackward,
  canMoveForward,
  isLatest,
  onModeChange,
  onPrevious,
  onNext,
  onJumpToLatest,
}: Readonly<{
  selected: HealthSelectedPeriod;
  range: HealthInclusiveRange;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  isLatest: boolean;
  onModeChange: (mode: HealthTimeRangeMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToLatest: () => void;
}>) {
  const { t, locale } = useLocale();
  const navigable = selected.mode !== "today" && selected.mode !== "all";
  const modeLabel = t.portal.health.periods[selected.mode];
  const periodLabel = formatHealthPeriodLabel(selected, locale, modeLabel);
  const startLabel = formatCalendarDate(range.start, locale);
  const endLabel = formatCalendarDate(range.end, locale);
  const exactRange = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

  return (
    <div
      className="flex flex-col gap-3"
      role="group"
      aria-label={t.portal.health.periodNavigation}
    >
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-0.5">
        {HEALTH_TIME_RANGE_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={selected.mode === mode}
            onClick={() => onModeChange(mode)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selected.mode === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.portal.health.periods[mode]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold capitalize text-card-foreground">
            {periodLabel}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.portal.health.inclusiveRange}: {exactRange}
          </p>
        </div>

        {navigable && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!canMoveBackward}
              aria-label={t.portal.health.previousPeriod}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canMoveForward}
              aria-label={t.portal.health.nextPeriod}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {!isLatest && (
              <button
                type="button"
                onClick={onJumpToLatest}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
                {t.portal.health.jumpToLatest}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
