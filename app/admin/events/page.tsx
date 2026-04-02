"use client";

import { useEffect, useState } from "react";

interface UserEvent {
  id: number;
  event_type: string;
  session_id: string;
  job_id: string | null;
  created_at: string | null;
}

interface EventsResponse {
  events: UserEvent[];
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

export default function AdminEventsPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/admin/events?limit=200")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<EventsResponse>;
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
        <p className="text-muted-foreground text-sm">Loading events…</p>
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total ?? 0} recent events
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Event", "Job ID", "Session", "When"].map((h) => (
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
            {(data?.events ?? []).map((e) => (
              <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-card-foreground">
                  {e.event_type}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {e.job_id ? e.job_id.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {e.session_id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmt(e.created_at)}
                </td>
              </tr>
            ))}
            {(data?.events ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
