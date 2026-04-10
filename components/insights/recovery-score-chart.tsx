/**
 * RecoveryScoreChart — Sprint 24.3
 *
 * Gauge chart showing the composite recovery score (0–100).
 * Uses its own ECharts lifecycle to register GaugeChart which is not
 * available in the shared EChart wrapper.
 *
 * Data source: sections.recovery_signals.recovery_composite_score
 */

"use client";

import { useCallback, useEffect, useRef } from "react";

interface RecoveryScoreChartProps {
  score: number;
  height?: number;
}

export function RecoveryScoreChart({ score, height = 200 }: Readonly<RecoveryScoreChartProps>) {
  if (score == null || typeof score !== "number") return null;

  return <RecoveryGauge score={Math.round(score)} height={height} />;
}

function RecoveryGauge({ score, height }: { score: number; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const initChart = useCallback(async () => {
    if (!containerRef.current) return;
    const echarts = await import("echarts/core");
    const { GaugeChart } = await import("echarts/charts");
    const { TooltipComponent } = await import("echarts/components");
    const { CanvasRenderer } = await import("echarts/renderers");

    echarts.use([GaugeChart, TooltipComponent, CanvasRenderer]);

    if (chartRef.current) chartRef.current.dispose();
    const instance = echarts.init(containerRef.current);
    chartRef.current = instance;
    instance.setOption(buildOption(score));
  }, [score]);

  useEffect(() => {
    initChart();
    return () => { chartRef.current?.dispose(); chartRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(buildOption(score), { notMerge: true });
    }
  }, [score]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Recovery score
      </p>
      <div
        ref={containerRef}
        style={{ width: "100%", height: `${height}px` }}
      />
    </div>
  );
}

function buildOption(score: number) {
  return {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: "85%",
        center: ["50%", "55%"],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.5,  "#f59e0b"],   // 0-50: amber
              [0.75, "#4ade80"],   // 50-75: muted green
              [1.0,  "#3dbe73"],   // 75-100: accent green
            ],
          },
        },
        pointer: {
          itemStyle: { color: "#3dbe73" },
          length: "55%",
          width: 4,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
          color: "#e5e5e5",
          fontSize: 28,
          fontWeight: 700,
          offsetCenter: [0, "10%"],
        },
        title: {
          text: "/ 100",
          color: "#888",
          fontSize: 11,
          offsetCenter: [0, "38%"],
        },
        data: [{ value: score, name: "/ 100" }],
      },
    ],
  };
}
