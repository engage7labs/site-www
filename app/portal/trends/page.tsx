"use client";

import type { EChartsOption } from "echarts";
import { useEffect, useRef } from "react";

export const dynamic = "force-dynamic";

// Lazy-load echarts to keep bundle size down
async function getEcharts() {
  const echarts = await import("echarts/core");
  const { LineChart } = await import("echarts/charts");
  const { GridComponent, TooltipComponent, LegendComponent } = await import(
    "echarts/components"
  );
  const { CanvasRenderer } = await import("echarts/renderers");
  echarts.use([
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    CanvasRenderer,
  ]);
  return echarts;
}

// Placeholder data — will be replaced with real API data
const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return d.toLocaleDateString("en-IE", { month: "short", day: "numeric" });
});

const SLEEP_HOURS = [
  7.2, 6.8, 7.5, 8.1, 6.9, 7.0, 7.4, 7.8, 6.5, 7.1, 7.6, 8.0, 7.3, 7.5,
];
const HRV = [42, 38, 45, 50, 35, 40, 44, 48, 33, 41, 46, 52, 43, 47];
const ACTIVITY_MIN = [32, 45, 28, 60, 22, 50, 35, 42, 55, 30, 48, 38, 62, 44];

const LIGHT_TEXT = "#E5E7EB";
const TOOLTIP_TEXT = "#111827";
const TOOLTIP_BG = "#F9FAFB";

function TrendChart({
  title,
  data,
  unit,
  color,
}: Readonly<{
  title: string;
  data: number[];
  unit: string;
  color: string;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart:
      | ReturnType<Awaited<ReturnType<typeof getEcharts>>["init"]>
      | undefined;
    let disposed = false;

    (async () => {
      const echarts = await getEcharts();
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current);
      const isDark = document.documentElement.classList.contains("dark");
      const axisLabelColor = isDark ? LIGHT_TEXT : "#5f6368";
      const splitLineColor = isDark
        ? "rgba(229, 231, 235, 0.09)"
        : "rgba(148, 163, 184, 0.18)";

      const option: EChartsOption = {
        textStyle: { color: axisLabelColor, fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          backgroundColor: TOOLTIP_BG,
          borderColor: "rgba(148, 163, 184, 0.22)",
          borderWidth: 1,
          textStyle: {
            color: TOOLTIP_TEXT,
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
          },
          extraCssText:
            "box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); border-radius: 12px;",
        },
        grid: { left: 40, right: 16, top: 12, bottom: 24 },
        xAxis: {
          type: "category",
          data: DAYS,
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisLine: { lineStyle: { color: "transparent" } },
          axisTick: { show: false, lineStyle: { color: axisLabelColor } },
        },
        yAxis: {
          type: "value",
          axisLabel: { fontSize: 10, color: axisLabelColor },
          axisTick: { show: false, lineStyle: { color: axisLabelColor } },
          splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
        },
        series: [
          {
            data,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 2.5,
              color,
              shadowBlur: 10,
              shadowColor: `${color}22`,
            },
            itemStyle: { color },
            emphasis: { focus: "series", lineStyle: { width: 3 } },
            areaStyle: { color: `${color}24` },
          },
        ],
      };
      chart.setOption(option);

      const observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    })();

    return () => {
      disposed = true;
      chart?.dispose();
    };
  }, [data, color]);

  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-4">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div ref={containerRef} className="h-52 w-full" />
    </div>
  );
}

export default function TrendsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          14-day rolling view of your key health metrics
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Sleep Duration"
          data={SLEEP_HOURS}
          unit="hours"
          color="#3dbe73"
        />
        <TrendChart
          title="Heart Rate Variability"
          data={HRV}
          unit="ms (rMSSD)"
          color="#6366f1"
        />
      </div>

      <TrendChart
        title="Active Minutes"
        data={ACTIVITY_MIN}
        unit="minutes / day"
        color="#f59e0b"
      />
    </div>
  );
}
