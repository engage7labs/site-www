"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Analysis {
  job_id: string;
  created_at: string | null;
  report_label: string | null;
  summary?: Record<string, unknown> | null;
  sections?: Record<string, unknown> | null;
  upload_status: string;
  has_teaser: boolean;
}

interface FeatureStoreSummary {
  date_end: string | null;
}

interface HealthDataResponse {
  feature_store: FeatureStoreSummary | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    completed: { icon: CheckCircle, label: "Complete", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    imported: { icon: CheckCircle, label: "Imported", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    processing: { icon: Loader2, label: "Processing", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    queued:     { icon: Clock,    label: "Queued",     color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    failed:     { icon: XCircle,  label: "Failed",     color: "text-destructive border-destructive/30 bg-destructive/10" },
  };
  const s = map[status] ?? map.queued;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.color}`}>
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCoverageDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function dataThroughFromSource(source: Record<string, unknown> | null): string | null {
  if (!source) return null;
  const direct =
    stringValue(source.dataset_end) ??
    stringValue(source.date_end) ??
    stringValue(source.data_through);
  if (direct) return direct;

  const period = asRecord(source.period);
  return stringValue(period?.end) ?? stringValue(period?.date_end);
}

function analysisDataThrough(
  analysis: Analysis,
  featureStore: FeatureStoreSummary | null,
  useFeatureStoreFallback: boolean,
): string | null {
  return (
    dataThroughFromSource(analysis.summary ?? null) ??
    dataThroughFromSource(analysis.sections ?? null) ??
    dataThroughFromSource(asRecord(analysis.sections?.baseline)) ??
    (useFeatureStoreFallback ? featureStore?.date_end ?? null : null)
  );
}

function analysisTitle(analysis: Analysis): string {
  const label = analysis.report_label?.trim();
  if (!label) return analysis.upload_status === "imported" ? "Imported report" : "Data update";
  if (/^Analysis\s+\d{1,2}\s+\w+\s+\d{4}$/i.test(label)) return "Data update";
  return label;
}

function sortNewestFirst(items: Analysis[]): Analysis[] {
  return [...items].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [featureStore, setFeatureStore] = useState<FeatureStoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [analysesRes, healthRes] = await Promise.allSettled([
          fetch("/api/proxy/portal/analyses"),
          fetch("/api/proxy/users/portal-health-data"),
        ]);

        if (analysesRes.status !== "fulfilled" || !analysesRes.value.ok) {
          throw new Error(
            analysesRes.status === "fulfilled"
              ? `${analysesRes.value.status}`
              : "Analyses unavailable",
          );
        }

        const data = (await analysesRes.value.json()) as { analyses: Analysis[] };
        setAnalyses(sortNewestFirst(data.analyses ?? []));

        if (healthRes.status === "fulfilled" && healthRes.value.ok) {
          const healthData = (await healthRes.value.json()) as HealthDataResponse;
          setFeatureStore(healthData.feature_store ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 md:px-8 mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Updates</h1>
          <p className="mt-1 text-sm text-muted-foreground">History of your Apple Health timeline updates</p>
        </div>
        <Link
          href="/portal/upload"
          className="flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Upload className="h-4 w-4" />
          Update Data
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center space-y-4">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No data updates yet.</p>
          <Link
            href="/portal/upload"
            className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <Upload className="h-4 w-4" />
            Refresh your Apple Health timeline
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Analysis</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Uploaded at</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data through</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analyses.map((a, index) => {
                const useFeatureStoreFallback =
                  index === 0 &&
                  (a.upload_status === "completed" || a.upload_status === "imported");
                const dataThrough = analysisDataThrough(
                  a,
                  featureStore,
                  useFeatureStoreFallback,
                );
                const title = analysisTitle(a);
                const showOriginalLabel = a.report_label && a.report_label !== title;

                return (
                  <tr key={a.job_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{title}</p>
                      {showOriginalLabel && (
                        <p className="text-xs text-muted-foreground">
                          Report label: {a.report_label}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">{a.job_id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCoverageDate(dataThrough)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.upload_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.has_teaser && (a.upload_status === "completed" || a.upload_status === "imported") && (
                        <a
                          href={`/api/proxy/portal/teaser?job_id=${a.job_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          View teaser →
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
