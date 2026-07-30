"use client";

import { EChart } from "@/components/insights/echart";
import {
  parseInsightVisualEvidence,
  type InsightVisualEvidence,
} from "@/lib/insight-visual-evidence";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";

const SERIES_COLORS = ["#2ea66a", "#6366f1"];

const UNIT_LABELS: Record<string, { en: string; pt: string }> = {
  hours: { en: "hours", pt: "horas" },
  milliseconds: { en: "milliseconds", pt: "milissegundos" },
  beats_per_minute: { en: "beats per minute", pt: "batimentos por minuto" },
  count: { en: "", pt: "" },
  kilocalories: { en: "kilocalories", pt: "quilocalorias" },
  kilometers: { en: "kilometres", pt: "quilômetros" },
  minutes: { en: "minutes", pt: "minutos" },
  percent: { en: "percent", pt: "por cento" },
};

interface InsightVisualEvidenceChartProps {
  evidence: unknown;
  locale: string;
  sampleCountLabel: string;
}

function unitLabel(unit: string, locale: string): string {
  const labels = UNIT_LABELS[unit];
  return labels ? (locale === "pt-BR" ? labels.pt : labels.en) : unit;
}

function formatValue(value: number, unit: string, locale: string): string {
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const label = unitLabel(unit, locale);
  return label ? `${formatted} ${label}` : formatted;
}

function pointLabel(point: { date?: string; period_label?: string }, locale: string): string {
  if (point.period_label) return point.period_label;
  if (!point.date) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${point.date}T00:00:00Z`));
}

function accessibilitySummary(
  evidence: InsightVisualEvidence,
  locale: string,
  sampleCountLabel: string,
): string {
  const values = evidence.series.flatMap((series) =>
    series.points.map(
      (point) => `${series.label}, ${pointLabel(point, locale)}: ${formatValue(point.value, series.unit, locale)}`,
    ),
  );
  if (evidence.reference) {
    values.push(
      `${evidence.reference.label}: ${formatValue(evidence.reference.value, evidence.reference.unit, locale)}`,
    );
  }
  values.push(sampleCountLabel.replace("{n}", String(evidence.sample_count)));
  return `${evidence.title}. ${evidence.caption} ${values.join(". ")}.`;
}

function chartOption(evidence: InsightVisualEvidence, locale: string): EChartsOption {
  const firstSeries = evidence.series[0];
  const categories = firstSeries.points.map((point) => pointLabel(point, locale));
  const common = {
    animation: false,
    silent: true,
    emphasis: { disabled: true },
  } as const;
  const referenceLine = evidence.reference
      ? {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: { color: "#94a3b8", type: "dashed" as const, width: 1 },
          data: [{ yAxis: evidence.reference.value }],
        }
      : undefined;
  const series: NonNullable<EChartsOption["series"]> = evidence.series.map((item, index) => {
    const data = item.points.map((point) => point.value);
    if (evidence.type === "metric_trend") {
      return {
        ...common,
        name: item.label,
        type: "line" as const,
        data,
        lineStyle: { width: 2, color: SERIES_COLORS[index] },
        itemStyle: { color: SERIES_COLORS[index] },
        symbol: "circle",
        symbolSize: 5,
      };
    }
    return {
      ...common,
      name: item.label,
      type: "bar" as const,
      data,
      itemStyle: { color: SERIES_COLORS[index], borderRadius: 3 },
      barMaxWidth: 28,
      markLine: referenceLine,
    };
  });

  return {
    animation: false,
    grid: { left: 42, right: 10, top: 12, bottom: 28, containLabel: false },
    tooltip: { show: false },
    legend: {
      show: evidence.series.length > 1,
      top: 0,
      right: 0,
      textStyle: { color: "#64748b", fontSize: 10 },
      itemWidth: 10,
      itemHeight: 6,
    },
    xAxis: {
      type: "category",
      data: categories,
      boundaryGap: evidence.type !== "metric_trend",
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.35)" } },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 9, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#64748b",
        fontSize: 9,
        formatter: (value: number) =>
          firstSeries.unit === "percent" ? `${value}%` : new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value),
      },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series,
  };
}

export function InsightVisualEvidenceChart({
  evidence: rawEvidence,
  locale,
  sampleCountLabel,
}: InsightVisualEvidenceChartProps) {
  const evidence = useMemo(() => parseInsightVisualEvidence(rawEvidence), [rawEvidence]);
  const option = useMemo(
    () => (evidence ? chartOption(evidence, locale) : null),
    [evidence, locale],
  );
  if (!evidence || !option) return null;

  return (
    <figure className="m-0 border-t border-border/60 pt-3">
      <figcaption>
        <p className="text-xs font-semibold text-card-foreground">{evidence.title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {evidence.caption}
        </p>
      </figcaption>
      <EChart
        option={option}
        height={128}
        className="mt-2 min-w-0"
        ariaLabel={accessibilitySummary(evidence, locale, sampleCountLabel)}
      />
      <p className="mt-1 text-[10px] text-muted-foreground">
        {sampleCountLabel.replace("{n}", String(evidence.sample_count))}
      </p>
    </figure>
  );
}
