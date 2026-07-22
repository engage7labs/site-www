import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const {
  addCalendarDays,
  calendarDateToKey,
  canMoveHealthPeriodBackward,
  canMoveHealthPeriodForward,
  formatHealthPeriodLabel,
  isCalendarDateInRange,
  isLatestHealthPeriod,
  moveHealthPeriod,
  normaliseHealthCalendarDate,
  parseCalendarDate,
  parseHealthCalendarDate,
  resolveHealthDateBounds,
  resolveHealthPeriodRange,
  resolveInitialHealthPeriod,
  selectHealthPeriodAnchor,
} = await import("../lib/health-time-range.ts");
const {
  buildSleepStageSeries,
  hasSleepStageData,
} = await import("../lib/sleep-stage-data.ts");

const key = calendarDateToKey;
const bounds = resolveHealthDateBounds([
  "2023-12-20",
  "2024-01-05",
  "2024-02-29",
  "2024-03-29",
]);
assert.ok(bounds);

assert.deepEqual(parseCalendarDate("2024-03-01"), {
  year: 2024,
  month: 3,
  day: 1,
});
assert.equal(parseCalendarDate("2024-02-30"), null);
assert.equal(parseCalendarDate("03/01/2024"), null);
assert.deepEqual(parseHealthCalendarDate("2024-03-01T00:30:00+00:00"), {
  year: 2024,
  month: 3,
  day: 1,
});
assert.deepEqual(parseHealthCalendarDate("01/03/2024"), {
  year: 2024,
  month: 3,
  day: 1,
});
assert.equal(
  normaliseHealthCalendarDate("2024-03-01T00:30:00-03:00"),
  "2024-03-01",
);

const actualToday = { year: 2026, month: 7, day: 16 };
const today = resolveInitialHealthPeriod("today", bounds, actualToday);
assert.deepEqual(resolveHealthPeriodRange(today, bounds), {
  start: actualToday,
  end: actualToday,
});
assert.equal(isCalendarDateInRange("2024-03-29", resolveHealthPeriodRange(today, bounds)), false);

const latestDay = resolveInitialHealthPeriod("day", bounds);
assert.equal(key(latestDay.anchor), "2024-03-29");
assert.equal(key(moveHealthPeriod(latestDay, -1).anchor), "2024-03-28");
assert.equal(key(moveHealthPeriod(moveHealthPeriod(latestDay, -1), 1).anchor), "2024-03-29");
assert.equal(canMoveHealthPeriodForward(latestDay, bounds), false);
assert.equal(isLatestHealthPeriod(latestDay, bounds), true);

const pickedDay = selectHealthPeriodAnchor(
  latestDay,
  parseCalendarDate("2024-02-29"),
  bounds,
);
assert.equal(key(resolveHealthPeriodRange(pickedDay, bounds).start), "2024-02-29");
assert.deepEqual(
  selectHealthPeriodAnchor(latestDay, parseCalendarDate("2025-01-01"), bounds),
  latestDay,
);

const week = resolveHealthPeriodRange(
  { mode: "week", anchor: parseCalendarDate("2024-03-01") },
  bounds,
);
assert.equal(key(week.start), "2024-02-26");
assert.equal(key(week.end), "2024-03-03");

const february28 = resolveHealthPeriodRange(
  { mode: "month", anchor: parseCalendarDate("2023-02-10") },
  bounds,
);
assert.equal(key(february28.end), "2023-02-28");
const leapFebruary = resolveHealthPeriodRange(
  { mode: "month", anchor: parseCalendarDate("2024-02-10") },
  bounds,
);
assert.equal(key(leapFebruary.end), "2024-02-29");
assert.equal(
  key(resolveHealthPeriodRange({ mode: "month", anchor: parseCalendarDate("2024-04-15") }, bounds).end),
  "2024-04-30",
);
assert.equal(
  key(resolveHealthPeriodRange({ mode: "month", anchor: parseCalendarDate("2024-03-15") }, bounds).end),
  "2024-03-31",
);

const calendarMonth = resolveHealthPeriodRange(
  { mode: "month", anchor: parseCalendarDate("2024-03-29") },
  bounds,
);
const rolling30 = resolveHealthPeriodRange(
  { mode: "last_30_days", anchor: parseCalendarDate("2024-03-29") },
  bounds,
);
assert.equal(key(calendarMonth.start), "2024-03-01");
assert.equal(key(rolling30.start), "2024-02-29");

const calendarWeek = resolveHealthPeriodRange(
  { mode: "week", anchor: parseCalendarDate("2024-03-29") },
  bounds,
);
const rolling7 = resolveHealthPeriodRange(
  { mode: "last_7_days", anchor: parseCalendarDate("2024-03-29") },
  bounds,
);
assert.equal(key(calendarWeek.start), "2024-03-25");
assert.equal(key(calendarWeek.end), "2024-03-31");
assert.equal(key(rolling7.start), "2024-03-23");
assert.equal(key(rolling7.end), "2024-03-29");
assert.equal(
  key(
    resolveHealthPeriodRange(
      selectHealthPeriodAnchor(
        { mode: "last_7_days", anchor: bounds.max },
        parseCalendarDate("2024-02-29"),
        bounds,
      ),
      bounds,
    ).end,
  ),
  "2024-02-29",
);

const december = { mode: "month", anchor: parseCalendarDate("2023-12-31") };
assert.equal(key(moveHealthPeriod(december, 1).anchor), "2024-01-31");
assert.equal(key(moveHealthPeriod(moveHealthPeriod(december, 1), -1).anchor), "2023-12-31");
const year = { mode: "year", anchor: parseCalendarDate("2023-06-15") };
assert.equal(key(resolveHealthPeriodRange(year, bounds).start), "2023-01-01");
assert.equal(key(resolveHealthPeriodRange(moveHealthPeriod(year, 1), bounds).end), "2024-12-31");

const earliestMonth = { mode: "month", anchor: parseCalendarDate("2023-12-20") };
assert.equal(canMoveHealthPeriodBackward(earliestMonth, bounds), false);
const historicalMonth = moveHealthPeriod(resolveInitialHealthPeriod("month", bounds), -1);
assert.equal(canMoveHealthPeriodForward(historicalMonth, bounds), true);
assert.equal(isLatestHealthPeriod(historicalMonth, bounds), false);
assert.deepEqual(resolveInitialHealthPeriod(historicalMonth.mode, bounds), {
  mode: "month",
  anchor: bounds.max,
});

assert.deepEqual(resolveHealthPeriodRange({ mode: "all", anchor: bounds.max }, bounds), {
  start: bounds.min,
  end: bounds.max,
});
const sparseRange = {
  start: parseCalendarDate("2024-03-01"),
  end: parseCalendarDate("2024-03-05"),
};
assert.equal(isCalendarDateInRange("2024-03-01", sparseRange), true);
assert.equal(isCalendarDateInRange("2024-03-03", sparseRange), true);
assert.equal(isCalendarDateInRange("2024-03-05", sparseRange), true);
assert.equal(isCalendarDateInRange("2024-03-06", sparseRange), false);
assert.equal(key(addCalendarDays(parseCalendarDate("2024-02-28"), 1)), "2024-02-29");

const rawSleepStagePoints = [
  {
    date: "2024-01-01T23:45:00+00:00",
    sleep_hours_core: 4.2,
    sleep_hours_deep: 1.1,
    sleep_hours_rem: 1.5,
    sleep_awake_minutes: 15,
  },
  {
    date: "02/01/2024",
    sleep_hours_core: 0,
    sleep_hours_deep: 1.3,
    sleep_awake_minutes: 0,
  },
  {
    date: "2024-08-09",
    sleep_awake_minutes: 15.3,
  },
];
const sleepStagePoints = rawSleepStagePoints.map((point) => ({
  ...point,
  date: normaliseHealthCalendarDate(point.date),
}));
assert.ok(sleepStagePoints.every((point) => point.date !== null));
const canonicalSleepStagePoints = sleepStagePoints.map((point) => ({
  ...point,
  date: point.date,
}));
const sleepStageBounds = resolveHealthDateBounds(
  canonicalSleepStagePoints.map((point) => point.date),
);
assert.ok(sleepStageBounds);
const allSleepStageRange = resolveHealthPeriodRange(
  { mode: "all", anchor: sleepStageBounds.max },
  sleepStageBounds,
);
const allTimeStagePoints = canonicalSleepStagePoints.filter((point) =>
  isCalendarDateInRange(point.date, allSleepStageRange),
);
assert.equal(allTimeStagePoints.length, 3);
assert.ok(allTimeStagePoints.every(hasSleepStageData));
const allTimeStageSeries = buildSleepStageSeries(allTimeStagePoints);
assert.deepEqual(
  allTimeStageSeries.map((series) => series.key),
  ["core", "deep", "rem", "awake"],
);
assert.deepEqual(allTimeStageSeries[0].data, [4.2, 0, null]);
assert.deepEqual(allTimeStageSeries[1].data, [1.1, 1.3, null]);
assert.deepEqual(allTimeStageSeries[2].data, [1.5, null, null]);
assert.deepEqual(allTimeStageSeries[3].data, [0.25, 0, 0.255]);
const januaryRange = resolveHealthPeriodRange(
  { mode: "month", anchor: parseCalendarDate("2024-01-02") },
  sleepStageBounds,
);
assert.equal(
  canonicalSleepStagePoints.filter((point) =>
    isCalendarDateInRange(point.date, januaryRange),
  ).length,
  2,
);

const monthSelection = { mode: "month", anchor: parseCalendarDate("2024-03-15") };
assert.match(formatHealthPeriodLabel(monthSelection, "en-IE", "Month"), /March 2024/);
assert.match(formatHealthPeriodLabel(monthSelection, "pt-BR", "Mês"), /março de 2024/i);

const dashboardSource = await readFile(
  new URL("../app/portal/health/health-dashboard.tsx", import.meta.url),
  "utf8",
);
assert.match(dashboardSource, /resolveHealthDateBounds\(availablePoints\.map/);
assert.match(dashboardSource, /filterByRange\(\s*allPoints,\s*item,\s*range,/);
assert.match(dashboardSource, /normaliseHealthPoints\(data\?\.data_points/);
assert.match(dashboardSource, /hasSleepStageData/);
assert.doesNotMatch(dashboardSource, /latestRawAndValidDays|filterByPeriod|new Date\(point\.date\)/);
assert.doesNotMatch(dashboardSource, /headerComparisonLabel/);
const navigatorSource = await readFile(
  new URL("../components/portal/health-period-navigator.tsx", import.meta.url),
  "utf8",
);
assert.match(navigatorSource, /type="date"/);
assert.match(navigatorSource, /type="month"/);
assert.match(navigatorSource, /pickerKind === "year"/);
assert.match(navigatorSource, /selected\.mode !== "today" && selected\.mode !== "all"/);
assert.match(navigatorSource, /CalendarDays/);
assert.match(navigatorSource, /jumpToPeriod/);
assert.match(navigatorSource, /aria-label=.*jumpToPeriod/);
assert.doesNotMatch(navigatorSource, /ChevronDown/);
assert.match(navigatorSource, /bottom-full/);
assert.doesNotMatch(navigatorSource, /top-full/);
assert.ok(
  navigatorSource.indexOf("onClick={onPrevious}") <
    navigatorSource.indexOf("onClick={onNext}"),
);
assert.ok(
  navigatorSource.indexOf("onClick={onNext}") <
    navigatorSource.indexOf("aria-expanded={selectorOpen}"),
);

console.log("Health calendar range and shared-dashboard consistency checks passed.");
