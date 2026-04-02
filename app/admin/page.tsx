"use client";

import { BarChart3, MessageSquare, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminMetrics {
  total_users: number;
  users_with_consent: number;
  users_by_plan: Record<string, number>;
  total_analyses: number;
  total_events: number;
  total_feedback: number;
  premium_unlock_events: number;
  conversion_rate_approx: number;
  analyses_per_user_avg: number;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
}: Readonly<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}>) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/admin/metrics")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<AdminMetrics>;
      })
      .then(setMetrics)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading metrics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-muted-foreground text-xs">
          Make sure you are signed in as an admin.
        </p>
      </div>
    );
  }

  if (!metrics) return null;

  const planEntries = Object.entries(metrics.users_by_plan).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Product validation metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total users"
          value={metrics.total_users}
          icon={Users}
          sub={`${metrics.users_with_consent} with consent`}
        />
        <MetricCard
          label="Total analyses"
          value={metrics.total_analyses}
          icon={BarChart3}
          sub={`avg ${metrics.analyses_per_user_avg} per user`}
        />
        <MetricCard
          label="Total events"
          value={metrics.total_events}
          icon={Zap}
          sub={`${metrics.premium_unlock_events} premium unlocks`}
        />
        <MetricCard
          label="Total feedback"
          value={metrics.total_feedback}
          icon={MessageSquare}
          sub={`${(metrics.conversion_rate_approx * 100).toFixed(
            1
          )}% conversion approx`}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground mb-4">
          Users by plan
        </h2>
        <div className="flex flex-wrap gap-3">
          {planEntries.map(([plan, count]) => (
            <div
              key={plan}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">{plan}</span>
              <span className="text-sm font-semibold text-card-foreground">
                {count}
              </span>
            </div>
          ))}
          {planEntries.length === 0 && (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/users", label: "View all users →" },
          { href: "/admin/events", label: "View events →" },
          { href: "/admin/feedback", label: "View feedback →" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="rounded-xl border border-border bg-card p-4 text-sm font-medium text-accent hover:bg-muted transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
