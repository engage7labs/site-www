export interface SleepStageDataPoint {
  date: string;
  [key: string]: unknown;
}

export const SLEEP_STAGE_FIELD_GROUPS: string[][] = [
  ["sleep_hours_core"],
  ["sleep_hours_deep"],
  ["sleep_hours_rem"],
  ["sleep_awake_minutes"],
];

export type SleepStageKey = "core" | "deep" | "rem" | "awake";

export interface SleepStageSeries {
  key: SleepStageKey;
  data: (number | null)[];
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function hasSleepStageData(point: SleepStageDataPoint): boolean {
  return SLEEP_STAGE_FIELD_GROUPS.some((keys) =>
    keys.some((key) => numberValue(point[key]) !== null),
  );
}

export function buildSleepStageSeries(
  points: SleepStageDataPoint[],
): SleepStageSeries[] {
  const valueFor = (point: SleepStageDataPoint, key: string) =>
    numberValue(point[key]);
  return [
    { key: "core", data: points.map((point) => valueFor(point, "sleep_hours_core")) },
    { key: "deep", data: points.map((point) => valueFor(point, "sleep_hours_deep")) },
    { key: "rem", data: points.map((point) => valueFor(point, "sleep_hours_rem")) },
    {
      key: "awake",
      data: points.map((point) => {
        const minutes = valueFor(point, "sleep_awake_minutes");
        return minutes === null ? null : minutes / 60;
      }),
    },
  ];
}
