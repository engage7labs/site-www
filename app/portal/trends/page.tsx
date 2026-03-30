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

function TrendChart({
  title,
  data,
  unit,
  color,
}: {
  title: string;
  data: number[];
  unit: string;
  color: string;
}) {
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

      const option: EChartsOption = {
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 16, top: 8, bottom: 24 },
        xAxis: {
          type: "category",
          data: DAYS,
          axisLabel: { fontSize: 10, color: "var(--muted-foreground)" },
          axisLine: { lineStyle: { color: "var(--border)" } },
        },
        yAxis: {
          type: "value",
          axisLabel: { fontSize: 10, color: "var(--muted-foreground)" },
          splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } },
        },
        series: [
          {
            data,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2, color },
            itemStyle: { color },
            areaStyle: { color: `${color}20` },
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
    <div className="rounded-xl border border-border bg-card p-4">
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
