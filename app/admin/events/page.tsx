"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

interface UserEvent {
  id: number;
  event_type: string;
  event_display: string;
  canonical_event: string;
  is_legacy: boolean;
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
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const PAGE_SIZE = 50;

  const fetchEvents = async (offset: number) => {
    const res = await fetch(
      `/api/proxy/admin/events?limit=${PAGE_SIZE}&offset=${offset}`
    );
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json() as Promise<EventsResponse>;
  };

  useEffect(() => {
    fetchEvents(0)
      .then((data) => {
        setEvents(data.events);
        setTotal(data.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchEvents(events.length);
      setEvents((prev) => [...prev, ...data.events]);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const copyId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(null), 1500);
    } catch {
      setCopiedValue(null);
    }
  };

  const renderIdCell = (value: string | null) => {
    if (!value) return <span className="text-muted-foreground">—</span>;
    const copied = copiedValue === value;
    return (
      <div className="flex min-w-[220px] max-w-[320px] items-center gap-2">
        <span
          className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-muted-foreground"
          title={value}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => void copyId(value)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Copy ID"
          title="Copy full ID"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  };

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
          {events.length} of {total} events
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
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-card-foreground">
                  <span>{e.event_display ?? e.event_type}</span>
                  {e.is_legacy && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      legacy
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{renderIdCell(e.job_id)}</td>
                <td className="px-4 py-3">{renderIdCell(e.session_id)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmt(e.created_at)}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
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

      {events.length < total && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loadingMore
              ? "Loading…"
              : `Load more (${total - events.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
