"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AnalysisReport {
  job_id: string;
  created_at: string | null;
  report_label: string | null;
  summary: Record<string, unknown> | null;
  sections?: Record<string, unknown> | null;
  dataset_hash: string | null;
  upload_status?: string | null;
}

interface FeatureStoreSummary {
  date_start: string | null;
  date_end: string | null;
  row_count: number | null;
  updated_at: string | null;
}

interface HealthDataResponse {
  feature_store: FeatureStoreSummary | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatPeriodDate(value: string, locale: string): string | null {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-IE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function periodFromSource(source: Record<string, unknown> | null): {
  start: string | null;
  end: string | null;
} {
  if (!source) return { start: null, end: null };
  const directStart =
    stringValue(source.dataset_start) ?? stringValue(source.date_start);
  const directEnd =
    stringValue(source.dataset_end) ?? stringValue(source.date_end);
  if (directStart || directEnd) return { start: directStart, end: directEnd };

  const period = asRecord(source.period);
  return {
    start: stringValue(period?.start) ?? stringValue(period?.date_start),
    end: stringValue(period?.end) ?? stringValue(period?.date_end),
  };
}

function formatPeriodLabel(
  report: AnalysisReport,
  latestFeatureStore: FeatureStoreSummary | null,
  isLatestReport: boolean,
  locale: string,
): string {
  const summaryPeriod = periodFromSource(report.summary);
  const sectionsPeriod =
    periodFromSource(report.sections ?? null);
  const baselinePeriod = periodFromSource(asRecord(report.sections?.baseline));
  const start =
    summaryPeriod.start ?? sectionsPeriod.start ?? baselinePeriod.start;
  const end = summaryPeriod.end ?? sectionsPeriod.end ?? baselinePeriod.end;
  const formattedStart = start ? formatPeriodDate(start, locale) : null;
  const formattedEnd = end ? formatPeriodDate(end, locale) : null;

  if (formattedStart && formattedEnd) return `${formattedStart} – ${formattedEnd}`;
  if (formattedEnd) return `Timeline through ${formattedEnd}`;

  const canUseLatestTimeline =
    isLatestReport &&
    report.upload_status !== "imported" &&
    Boolean(latestFeatureStore?.date_end);
  if (!canUseLatestTimeline) return "—";

  const timelineStart = latestFeatureStore?.date_start
    ? formatPeriodDate(latestFeatureStore.date_start, locale)
    : null;
  const timelineEnd = latestFeatureStore?.date_end
    ? formatPeriodDate(latestFeatureStore.date_end, locale)
    : null;
  if (timelineStart && timelineEnd) return `${timelineStart} – ${timelineEnd}`;
  if (timelineEnd) return `Timeline through ${timelineEnd}`;
  return "—";
}

function reportName(report: AnalysisReport): string {
  if (report.report_label) return report.report_label;
  return report.upload_status === "imported"
    ? "Claimed public analysis"
    : "Health analysis";
}

function shortJobId(jobId: string): string {
  return jobId.slice(0, 8);
}

export default function ReportsPage() {
  const { locale } = useLocale();
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [featureStore, setFeatureStore] = useState<FeatureStoreSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [reportsRes, healthRes] = await Promise.allSettled([
          fetch("/api/proxy/users/portal-analyses"),
          fetch("/api/proxy/users/portal-health-data"),
        ]);
        if (reportsRes.status === "fulfilled" && reportsRes.value.ok) {
          const data = await reportsRes.value.json();
          setReports(data.analyses ?? []);
        }
        if (healthRes.status === "fulfilled" && healthRes.value.ok) {
          const data = (await healthRes.value.json()) as HealthDataResponse;
          setFeatureStore(data.feature_store ?? null);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No data updates yet. Refresh your Apple Health timeline to generate
            your first Portal report.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Report
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Period
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => {
                  const dateStr = report.created_at
                    ? new Date(report.created_at).toLocaleString(locale === "pt-BR" ? "pt-BR" : "en-IE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—";
                  const period = formatPeriodLabel(report, featureStore, index === 0, locale);

                  return (
                    <tr
                      key={report.job_id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-card-foreground">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2 text-card-foreground">
                          <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p>{reportName(report)}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                              {shortJobId(report.job_id)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {period}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium">
                          Updated
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/portal/reports/${report.job_id}`}
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
