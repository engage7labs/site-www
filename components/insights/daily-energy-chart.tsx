/**
 * DailyEnergyChart — Sprint 24.3
 *
 * Stacked bar showing average daily energy breakdown (basal + active kcal).
 * Uses the shared EChart wrapper (BarChart is already registered there).
 *
 * Data source: sections.activity_signals (from Sprint 24.2 engine)
 */

"use client";

import { useMemo } from "react";
import { EChart } from "./echart";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActivitySignals = Record<string, any>;

interface DailyEnergyChartProps {
  data: ActivitySignals;
  height?: number;
  /** Override default header text — pass locale-aware label with period info */
  label?: string;
}

export function DailyEnergyChart({ data, height = 200, label }: Readonly<DailyEnergyChartProps>) {
  const basalMean = data?.basal_energy_cal?.mean ?? null;
  const totalMean = data?.total_energy_cal?.mean ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const option: any = useMemo(() => {
    if (basalMean == null) return null;

    const basal  = Math.round(basalMean);
    const active = totalMean != null ? Math.max(0, Math.round(totalMean - basalMean)) : null;

    const categories = active != null ? ["Basal", "Active"] : ["Basal"];
    const basalSeries: number[] = active != null ? [basal, 0] : [basal];
    const activeSeries: number[] | null = active != null ? [0, active] : null;

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) =>
          (params as { seriesName: string; value: number }[])
            .map((p) => `${p.seriesName}: ${p.value.toLocaleString()} kcal`)
            .join("<br/>"),
      },
      grid: { left: 48, right: 12, top: 12, bottom: 40, containLabel: false },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { color: "#888", fontSize: 11 },
        axisLine: { lineStyle: { color: "#333" } },
      },
      yAxis: {
        type: "value",
        name: "kcal",
        nameTextStyle: { color: "#888", fontSize: 10 },
        axisLabel: { color: "#888", fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}` },
        splitLine: { lineStyle: { color: "#2a2a2a" } },
      },
      series: [
        {
          name: "Basal",
          type: "bar",
          stack: "energy",
          barWidth: "40%",
          data: basalSeries,
          itemStyle: { color: "#444", borderRadius: [0, 0, 4, 4] },
          label: {
            show: true,
            position: "inside",
            formatter: (p: { value: number }) => `${p.value.toLocaleString()}`,
            color: "#aaa",
            fontSize: 10,
          },
        },
        ...(activeSeries != null
          ? [
              {
                name: "Active",
                type: "bar" as const,
                stack: "energy",
                barWidth: "40%",
                data: activeSeries,
                itemStyle: { color: "#3dbe73", borderRadius: [4, 4, 0, 0] },
                label: {
                  show: true,
                  position: "inside",
                  formatter: (p: { value: number }) => p.value > 0 ? `${p.value.toLocaleString()}` : "",
                  color: "#1a1a1a",
                  fontSize: 10,
                  fontWeight: 600,
                },
              },
            ]
          : []),
      ],
    };
  }, [basalMean, totalMean]);

  if (!option) return null;

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label ?? "Daily energy — avg kcal"}
      </p>
      <EChart option={option} height={height} />
    </div>
  );
}
