"use client";

import { useLocale } from "@/components/providers/locale-provider";
import {
  HEALTH_TIME_RANGE_MODES,
  calendarDateToKey,
  formatCalendarDate,
  formatHealthPeriodLabel,
  parseCalendarDate,
  type CalendarDate,
  type HealthDateBounds,
  type HealthInclusiveRange,
  type HealthSelectedPeriod,
  type HealthTimeRangeMode,
} from "@/lib/health-time-range";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
} from "lucide-react";
import { useId, useState } from "react";

export function HealthPeriodNavigator({
  selected,
  bounds,
  range,
  canMoveBackward,
  canMoveForward,
  isLatest,
  onModeChange,
  onPrevious,
  onNext,
  onJumpToLatest,
  onAnchorChange,
}: Readonly<{
  selected: HealthSelectedPeriod;
  bounds: HealthDateBounds;
  range: HealthInclusiveRange;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  isLatest: boolean;
  onModeChange: (mode: HealthTimeRangeMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToLatest: () => void;
  onAnchorChange: (anchor: CalendarDate) => void;
}>) {
  const { t, locale } = useLocale();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorId = useId();
  const navigable = selected.mode !== "today" && selected.mode !== "all";
  const modeLabel = t.portal.health.periods[selected.mode];
  const periodLabel = formatHealthPeriodLabel(selected, locale, modeLabel);
  const startLabel = formatCalendarDate(range.start, locale);
  const endLabel = formatCalendarDate(range.end, locale);
  const exactRange = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  const pickerInputId = `${selectorId}-input`;
  const pickerKind =
    selected.mode === "month"
      ? "month"
      : selected.mode === "year"
        ? "year"
        : navigable
          ? "date"
          : null;
  const handlePickerChange = (value: string) => {
    const anchor =
      pickerKind === "month"
        ? parseCalendarDate(`${value}-01`)
        : pickerKind === "year"
          ? parseCalendarDate(`${value}-01-01`)
          : parseCalendarDate(value);
    if (anchor) {
      onAnchorChange(anchor);
      setSelectorOpen(false);
    }
  };

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
            onClick={() => {
              setSelectorOpen(false);
              onModeChange(mode);
            }}
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
          {pickerKind ? (
            <button
              type="button"
              aria-expanded={selectorOpen}
              aria-controls={selectorId}
              aria-label={`${t.portal.health.jumpToPeriod}: ${periodLabel}`}
              onClick={() => setSelectorOpen((open) => !open)}
              className="group inline-flex min-h-10 w-full max-w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm font-semibold text-card-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
            >
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">
                {t.portal.health.jumpToPeriod}: {periodLabel}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  selectorOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          ) : (
            <p className="text-sm font-semibold capitalize text-card-foreground">
              {periodLabel}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.portal.health.inclusiveRange}: {exactRange}
          </p>
          {selectorOpen && pickerKind && (
            <div id={selectorId} className="mt-3 max-w-xs">
              <label
                htmlFor={pickerInputId}
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                {selected.mode === "week"
                  ? t.portal.health.chooseWeekDate
                  : selected.mode === "last_7_days" ||
                      selected.mode === "last_30_days"
                    ? t.portal.health.chooseEndDate
                    : t.portal.health.choosePeriod}
              </label>
              {pickerKind === "date" && (
                <input
                  id={pickerInputId}
                  type="date"
                  value={calendarDateToKey(selected.anchor)}
                  min={calendarDateToKey(bounds.min)}
                  max={calendarDateToKey(bounds.max)}
                  onChange={(event) => handlePickerChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                />
              )}
              {pickerKind === "month" && (
                <input
                  id={pickerInputId}
                  type="month"
                  value={calendarDateToKey(selected.anchor).slice(0, 7)}
                  min={calendarDateToKey(bounds.min).slice(0, 7)}
                  max={calendarDateToKey(bounds.max).slice(0, 7)}
                  onChange={(event) => handlePickerChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                />
              )}
              {pickerKind === "year" && (
                <select
                  id={pickerInputId}
                  value={selected.anchor.year}
                  onChange={(event) => handlePickerChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {Array.from(
                    { length: bounds.max.year - bounds.min.year + 1 },
                    (_, index) => bounds.min.year + index,
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
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
