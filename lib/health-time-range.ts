export type HealthTimeRangeMode =
  | "today"
  | "day"
  | "week"
  | "month"
  | "last_7_days"
  | "last_30_days"
  | "year"
  | "all";

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface HealthDateBounds {
  min: CalendarDate;
  max: CalendarDate;
}

export interface HealthSelectedPeriod {
  mode: HealthTimeRangeMode;
  anchor: CalendarDate;
}

export interface HealthInclusiveRange {
  start: CalendarDate;
  end: CalendarDate;
}

export const HEALTH_TIME_RANGE_MODES: HealthTimeRangeMode[] = [
  "today",
  "day",
  "week",
  "month",
  "last_7_days",
  "last_30_days",
  "year",
  "all",
];

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInCalendarMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  if (
    date.month < 1 ||
    date.month > 12 ||
    date.day < 1 ||
    date.day > daysInCalendarMonth(date.year, date.month)
  ) {
    return null;
  }
  return date;
}

export function calendarDateToKey(date: CalendarDate): string {
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function compareCalendarDates(
  left: CalendarDate,
  right: CalendarDate,
): number {
  return calendarDateToKey(left).localeCompare(calendarDateToKey(right));
}

export function addCalendarDays(
  source: CalendarDate,
  amount: number,
): CalendarDate {
  let result = { ...source };
  const direction = Math.sign(amount);
  for (let remaining = Math.abs(amount); remaining > 0; remaining -= 1) {
    result.day += direction;
    if (direction > 0 && result.day > daysInCalendarMonth(result.year, result.month)) {
      result.day = 1;
      result.month += 1;
      if (result.month > 12) {
        result.month = 1;
        result.year += 1;
      }
    } else if (direction < 0 && result.day < 1) {
      result.month -= 1;
      if (result.month < 1) {
        result.month = 12;
        result.year -= 1;
      }
      result.day = daysInCalendarMonth(result.year, result.month);
    }
  }
  return result;
}

export function addCalendarMonths(
  source: CalendarDate,
  amount: number,
): CalendarDate {
  const absoluteMonth = source.year * 12 + source.month - 1 + amount;
  const year = Math.floor(absoluteMonth / 12);
  const month = ((absoluteMonth % 12) + 12) % 12 + 1;
  return {
    year,
    month,
    day: Math.min(source.day, daysInCalendarMonth(year, month)),
  };
}

export function addCalendarYears(
  source: CalendarDate,
  amount: number,
): CalendarDate {
  const year = source.year + amount;
  return {
    year,
    month: source.month,
    day: Math.min(source.day, daysInCalendarMonth(year, source.month)),
  };
}

function localToday(): CalendarDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

// Gregorian day-of-week calculation: 0 is Sunday, 1 is Monday.
export function calendarDateWeekday(date: CalendarDate): number {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let year = date.year;
  if (date.month < 3) year -= 1;
  return (
    year +
    Math.floor(year / 4) -
    Math.floor(year / 100) +
    Math.floor(year / 400) +
    offsets[date.month - 1] +
    date.day
  ) % 7;
}

function startOfCalendarWeek(date: CalendarDate): CalendarDate {
  const weekday = calendarDateWeekday(date);
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return addCalendarDays(date, -daysSinceMonday);
}

export function resolveHealthDateBounds(
  values: Iterable<string>,
): HealthDateBounds | null {
  const dates = [...values]
    .map(parseCalendarDate)
    .filter((date): date is CalendarDate => date !== null)
    .sort(compareCalendarDates);
  if (dates.length === 0) return null;
  return { min: dates[0], max: dates[dates.length - 1] };
}

export function resolveInitialHealthPeriod(
  mode: HealthTimeRangeMode,
  bounds: HealthDateBounds,
  today: CalendarDate = localToday(),
): HealthSelectedPeriod {
  return {
    mode,
    anchor: mode === "today" ? today : bounds.max,
  };
}

export function resolveHealthPeriodRange(
  selected: HealthSelectedPeriod,
  bounds: HealthDateBounds,
): HealthInclusiveRange {
  const { anchor, mode } = selected;
  if (mode === "all") return { start: bounds.min, end: bounds.max };
  if (mode === "today" || mode === "day") {
    return { start: anchor, end: anchor };
  }
  if (mode === "week") {
    const start = startOfCalendarWeek(anchor);
    return { start, end: addCalendarDays(start, 6) };
  }
  if (mode === "month") {
    return {
      start: { year: anchor.year, month: anchor.month, day: 1 },
      end: {
        year: anchor.year,
        month: anchor.month,
        day: daysInCalendarMonth(anchor.year, anchor.month),
      },
    };
  }
  if (mode === "last_7_days") {
    return { start: addCalendarDays(anchor, -6), end: anchor };
  }
  if (mode === "last_30_days") {
    return { start: addCalendarDays(anchor, -29), end: anchor };
  }
  return {
    start: { year: anchor.year, month: 1, day: 1 },
    end: { year: anchor.year, month: 12, day: 31 },
  };
}

export function moveHealthPeriod(
  selected: HealthSelectedPeriod,
  direction: -1 | 1,
): HealthSelectedPeriod {
  const { mode } = selected;
  if (mode === "today" || mode === "all") return selected;
  const anchor =
    mode === "day"
      ? addCalendarDays(selected.anchor, direction)
      : mode === "week" || mode === "last_7_days"
        ? addCalendarDays(selected.anchor, direction * 7)
        : mode === "last_30_days"
          ? addCalendarDays(selected.anchor, direction * 30)
          : mode === "month"
            ? addCalendarMonths(selected.anchor, direction)
            : addCalendarYears(selected.anchor, direction);
  return { mode, anchor };
}

export function canMoveHealthPeriodBackward(
  selected: HealthSelectedPeriod,
  bounds: HealthDateBounds,
): boolean {
  if (selected.mode === "today" || selected.mode === "all") return false;
  const previous = resolveHealthPeriodRange(moveHealthPeriod(selected, -1), bounds);
  return compareCalendarDates(previous.end, bounds.min) >= 0;
}

export function canMoveHealthPeriodForward(
  selected: HealthSelectedPeriod,
  bounds: HealthDateBounds,
): boolean {
  if (selected.mode === "today" || selected.mode === "all") return false;
  const next = resolveHealthPeriodRange(moveHealthPeriod(selected, 1), bounds);
  return compareCalendarDates(next.start, bounds.max) <= 0;
}

export function isLatestHealthPeriod(
  selected: HealthSelectedPeriod,
  bounds: HealthDateBounds,
  today: CalendarDate = localToday(),
): boolean {
  const latest = resolveInitialHealthPeriod(selected.mode, bounds, today);
  const selectedRange = resolveHealthPeriodRange(selected, bounds);
  const latestRange = resolveHealthPeriodRange(latest, bounds);
  return (
    compareCalendarDates(selectedRange.start, latestRange.start) === 0 &&
    compareCalendarDates(selectedRange.end, latestRange.end) === 0
  );
}

export function isCalendarDateInRange(
  value: string,
  range: HealthInclusiveRange,
): boolean {
  const date = parseCalendarDate(value);
  return Boolean(
    date &&
      compareCalendarDates(date, range.start) >= 0 &&
      compareCalendarDates(date, range.end) <= 0,
  );
}

export function formatCalendarDate(
  date: CalendarDate,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
): string {
  const localNoon = new Date(date.year, date.month - 1, date.day, 12);
  return new Intl.DateTimeFormat(locale === "pt-BR" ? "pt-BR" : "en-IE", options).format(
    localNoon,
  );
}

export function formatHealthPeriodLabel(
  selected: HealthSelectedPeriod,
  locale: string,
  modeLabel: string,
): string {
  if (selected.mode === "month") {
    return formatCalendarDate(selected.anchor, locale, {
      month: "long",
      year: "numeric",
    });
  }
  if (selected.mode === "year") return String(selected.anchor.year);
  if (selected.mode === "today" || selected.mode === "day") {
    return formatCalendarDate(selected.anchor, locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return modeLabel;
}
