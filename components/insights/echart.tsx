/**
 * EChart — Lazy-loaded ECharts React wrapper
 *
 * Renders an ECharts instance with responsive sizing.
 * Uses dynamic import to keep the initial bundle light.
 */

"use client";

import type { EChartsOption } from "echarts";
import { useCallback, useEffect, useRef } from "react";

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
  onChartReady?: () => void;
  onInteraction?: () => void;
}

export function EChart({
  option,
  height = 260,
  className = "",
  onChartReady,
  onInteraction,
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const initChart = useCallback(async () => {
    if (!containerRef.current) return;
    const echarts = await import("echarts/core");
    const { LineChart, BarChart } = await import("echarts/charts");
    const {
      GridComponent,
      TooltipComponent,
      LegendComponent,
      MarkLineComponent,
    } = await import("echarts/components");
    const { CanvasRenderer } = await import("echarts/renderers");

    echarts.use([
      LineChart,
      BarChart,
      GridComponent,
      TooltipComponent,
      LegendComponent,
      MarkLineComponent,
      CanvasRenderer,
    ]);

    if (chartRef.current) {
      chartRef.current.dispose();
    }

    const instance = echarts.init(containerRef.current);
    chartRef.current = instance;
    instance.setOption(option);

    if (onInteraction) {
      instance.on("click", onInteraction);
      instance.on("dataZoom", onInteraction);
    }

    onChartReady?.();
  }, [option, onChartReady, onInteraction]);

  useEffect(() => {
    initChart();

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update option when it changes (but don't re-init the whole chart)
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, { notMerge: true });
    }
  }, [option]);

  // Resize handling
  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}
