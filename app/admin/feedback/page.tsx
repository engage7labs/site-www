"use client";

import { useEffect, useState } from "react";

interface FeedbackRow {
  id: number;
  job_id: string | null;
  feedback_type: string;
  surface: string;
  target_type: string;
  target_id: string | null;
  sentiment: "yes" | "no";
  source: "current" | "legacy" | "migration";
  note: string | null;
  created_at: string | null;
}

interface FeedbackResponse {
  feedback: FeedbackRow[];
  aggregate: Record<string, number>;
  total: number;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FEEDBACK_COLORS: Record<string, string> = {
  yes: "bg-emerald-500/10 text-emerald-400",
  no: "bg-red-500/10 text-red-400",
};

function FeedbackBadge({ sentiment }: Readonly<{ sentiment: string }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        FEEDBACK_COLORS[sentiment] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {sentiment === "yes" ? "Yes" : "No"}
    </span>
  );
}

function label(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminFeedbackPage() {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/admin/feedback")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<FeedbackResponse>;
      })
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading feedback…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  const aggregateEntries = Object.entries(data?.aggregate ?? {}).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total ?? 0} feedback records
        </p>
      </div>

      {/* Aggregate counts */}
      {aggregateEntries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {aggregateEntries.map(([type, count]) => (
            <div
              key={type}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">{type}</span>
              <span className="text-sm font-semibold text-card-foreground">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["When", "Surface", "Target", "Sentiment", "Note", "Job / Report", "Source"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.feedback ?? []).map((f) => (
              <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmt(f.created_at)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {label(f.surface)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {label(f.target_type)}
                  {f.target_id ? (
                    <span className="ml-1 font-mono text-[10px] text-muted-foreground/70">
                      {f.target_id.slice(0, 12)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <FeedbackBadge sentiment={f.sentiment} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {f.note ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {f.job_id ? f.job_id.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {label(f.source)}
                </td>
              </tr>
            ))}
            {(data?.feedback ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No feedback yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
