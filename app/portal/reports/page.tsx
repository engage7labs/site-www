"use client";

import { Eye, FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalysisReport {
  job_id: string;
  created_at: string | null;
  report_label: string | null;
  summary: Record<string, unknown> | null;
  dataset_hash: string | null;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proxy/users/portal-analyses");
        if (res.ok) {
          const data = await res.json();
          setReports(data.analyses ?? []);
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your generated health reports
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No reports yet. Upload an Apple Health export to generate your first
            report.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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
                {reports.map((report) => {
                  const dateStr = report.created_at
                    ? new Date(report.created_at).toLocaleDateString("en-IE")
                    : "—";
                  const summary = report.summary as Record<
                    string,
                    unknown
                  > | null;
                  const period =
                    summary?.dataset_start && summary?.dataset_end
                      ? `${String(summary.dataset_start)} → ${String(
                          summary.dataset_end
                        )}`
                      : "—";

                  return (
                    <tr
                      key={report.job_id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-card-foreground">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-card-foreground">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {report.report_label ?? "Health Analysis"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {period}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium">
                          Complete
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/result/${report.job_id}`}
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </a>
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
