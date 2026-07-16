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
  parseCalendarDate,
  resolveHealthDateBounds,
  resolveHealthPeriodRange,
  resolveInitialHealthPeriod,
  selectHealthPeriodAnchor,
} = await import("../lib/health-time-range.ts");

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

const monthSelection = { mode: "month", anchor: parseCalendarDate("2024-03-15") };
assert.match(formatHealthPeriodLabel(monthSelection, "en-IE", "Month"), /March 2024/);
assert.match(formatHealthPeriodLabel(monthSelection, "pt-BR", "Mês"), /março de 2024/i);

const dashboardSource = await readFile(
  new URL("../app/portal/health/health-dashboard.tsx", import.meta.url),
  "utf8",
);
assert.match(dashboardSource, /resolveHealthDateBounds\(availablePoints\.map/);
assert.match(dashboardSource, /filterByRange\(\s*allPoints,\s*item,\s*range,/);
assert.doesNotMatch(dashboardSource, /latestRawAndValidDays|filterByPeriod|new Date\(point\.date\)/);
const navigatorSource = await readFile(
  new URL("../components/portal/health-period-navigator.tsx", import.meta.url),
  "utf8",
);
assert.match(navigatorSource, /type="date"/);
assert.match(navigatorSource, /type="month"/);
assert.match(navigatorSource, /pickerKind === "year"/);
assert.match(navigatorSource, /selected\.mode !== "today" && selected\.mode !== "all"/);

console.log("Health calendar range and shared-dashboard consistency checks passed.");
