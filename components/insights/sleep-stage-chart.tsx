/**
 * SleepStageChart — Sprint 24.3
 *
 * Donut chart showing sleep stage breakdown (Core / Deep / REM / Other).
 * Uses its own ECharts lifecycle to register PieChart which is not
 * available in the shared EChart wrapper.
 *
 * Data source: sections.sleep_stages (from Sprint 24.2 engine)
 */

"use client";

import { useCallback, useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SleepStages = Record<string, any>;

interface SleepStageChartProps {
  data: SleepStages;
  height?: number;
  /** Override default header text — pass locale-aware label with period info */
  label?: string;
}

export function SleepStageChart({ data, height = 220, label }: Readonly<SleepStageChartProps>) {
  if (!data?.has_stage_data) return null;

  const core  = data.averages?.core_hours ?? 0;
  const deep  = data.averages?.deep_hours ?? 0;
  const rem   = data.averages?.rem_hours  ?? 0;
  const total = data.averages ? (core + deep + rem) : 0;

  if (total <= 0) return null;

  return <SleepStageDonut core={core} deep={deep} rem={rem} total={total} height={height} label={label} />;
}

function SleepStageDonut({
  core, deep, rem, total, height, label,
}: {
  core: number; deep: number; rem: number; total: number; height: number; label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const initChart = useCallback(async () => {
    if (!containerRef.current) return;
    const echarts = await import("echarts/core");
    const { PieChart } = await import("echarts/charts");
    const { TooltipComponent, LegendComponent } = await import("echarts/components");
    const { CanvasRenderer } = await import("echarts/renderers");

    echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

    if (chartRef.current) chartRef.current.dispose();
    const instance = echarts.init(containerRef.current);
    chartRef.current = instance;

    const option = buildOption(core, deep, rem, total);
    instance.setOption(option);
  }, [core, deep, rem, total]);

  useEffect(() => {
    initChart();
    return () => { chartRef.current?.dispose(); chartRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(buildOption(core, deep, rem, total), { notMerge: true });
    }
  }, [core, deep, rem, total]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label ?? "Sleep stages — avg per night"}
      </p>
      <div
        ref={containerRef}
        style={{ width: "100%", height: `${height}px` }}
      />
    </div>
  );
}

function fmt(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function buildOption(core: number, deep: number, rem: number, total: number) {
  const other = Math.max(0, total - core - deep - rem);
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}: ${fmt(params.value)} (${params.percent.toFixed(0)}%)`,
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      textStyle: { color: "#888", fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "75%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "center",
          formatter: () => fmt(total),
          fontSize: 16,
          fontWeight: 600,
          color: "#e5e5e5",
        },
        emphasis: { label: { show: true } },
        labelLine: { show: false },
        data: [
          { value: core,  name: "Core",  itemStyle: { color: "#4ade80" } },
          { value: deep,  name: "Deep",  itemStyle: { color: "#3dbe73" } },
          { value: rem,   name: "REM",   itemStyle: { color: "#f59e0b" } },
          ...(other > 0.05 ? [{ value: other, name: "Other", itemStyle: { color: "#444" } }] : []),
        ],
      },
    ],
  };
}
