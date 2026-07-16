"use client";

import {
  canMoveHealthPeriodBackward,
  canMoveHealthPeriodForward,
  isLatestHealthPeriod,
  moveHealthPeriod,
  resolveHealthPeriodRange,
  resolveInitialHealthPeriod,
  type HealthDateBounds,
  type HealthSelectedPeriod,
  type HealthTimeRangeMode,
} from "@/lib/health-time-range";
import { useMemo, useState } from "react";

export function useHealthTimeRange(bounds: HealthDateBounds | null) {
  const [selection, setSelection] = useState<HealthSelectedPeriod | null>(null);
  const selected = useMemo(() => {
    if (!bounds) return null;
    return selection ?? resolveInitialHealthPeriod("day", bounds);
  }, [bounds, selection]);
  const range = useMemo(
    () => (bounds && selected ? resolveHealthPeriodRange(selected, bounds) : null),
    [bounds, selected],
  );

  const selectMode = (mode: HealthTimeRangeMode) => {
    if (bounds) setSelection(resolveInitialHealthPeriod(mode, bounds));
  };
  const move = (direction: -1 | 1) => {
    if (selected) setSelection(moveHealthPeriod(selected, direction));
  };
  const jumpToLatest = () => {
    if (bounds && selected) {
      setSelection(resolveInitialHealthPeriod(selected.mode, bounds));
    }
  };

  return {
    selected,
    range,
    selectMode,
    moveBackward: () => move(-1),
    moveForward: () => move(1),
    jumpToLatest,
    canMoveBackward: Boolean(
      bounds && selected && canMoveHealthPeriodBackward(selected, bounds),
    ),
    canMoveForward: Boolean(
      bounds && selected && canMoveHealthPeriodForward(selected, bounds),
    ),
    isLatest: Boolean(bounds && selected && isLatestHealthPeriod(selected, bounds)),
  };
}
