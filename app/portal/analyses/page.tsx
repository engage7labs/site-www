"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Analysis {
  job_id: string;
  created_at: string | null;
  report_label: string | null;
  upload_status: string;
  has_teaser: boolean;
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
  return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/proxy/portal/analyses")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<{ analyses: Analysis[] }>;
      })
      .then((data) => setAnalyses(data.analyses))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto px-4 md:px-8 mt-10">
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
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analyses.map((a) => (
                <tr key={a.job_id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{a.report_label ?? "Analysis"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{a.job_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(a.created_at)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
