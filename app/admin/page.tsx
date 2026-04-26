"use client";

import { BarChart3, MessageSquare, TrendingUp, UserCheck, Users, Zap } from "lucide-react";
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
  users_with_analysis: number;
  new_users_7d: number;
  funnel: {
    total_users: number;
    users_with_consent: number;
    users_with_analysis: number;
    premium_users: number;
  };
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
  const total_users = metrics.total_users;
  const funnel = metrics.funnel ?? {
    total_users: metrics.total_users,
    users_with_consent: metrics.users_with_consent,
    users_with_analysis: metrics.users_with_analysis ?? 0,
    premium_users: metrics.users_by_plan.premium ?? 0,
  };

  // Funnel bar widths as % relative to the first step
  const funnelMax = Math.max(funnel.total_users, 1);
  const funnelSteps = [
    { label: "Signed up", value: funnel.total_users, color: "#6366f1" },
    { label: "Consented", value: funnel.users_with_consent, color: "#3dbe73" },
    { label: "Ran analysis", value: funnel.users_with_analysis, color: "#e5a336" },
    { label: "Premium", value: funnel.premium_users, color: "#e6b800" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Product validation metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total users"
          value={metrics.total_users}
          icon={Users}
          sub={`${metrics.new_users_7d} new (7d)`}
        />
        <MetricCard
          label="Consented"
          value={metrics.users_with_consent}
          icon={UserCheck}
          sub={`${total_users > 0 ? Math.round((metrics.users_with_consent / total_users) * 100) : 0}% of total`}
        />
        <MetricCard
          label="Activated"
          value={metrics.users_with_analysis}
          icon={TrendingUp}
          sub={`${total_users > 0 ? Math.round((metrics.users_with_analysis / total_users) * 100) : 0}% ran analysis`}
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
          label="Feedback"
          value={metrics.total_feedback}
          icon={MessageSquare}
          sub={`${(metrics.conversion_rate_approx * 100).toFixed(1)}% premium rate`}
        />
      </div>

      {/* Conversion funnel — Sprint 31.1 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground mb-4">
          Conversion funnel
        </h2>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = Math.round((step.value / funnelMax) * 100);
            const dropPct =
              i > 0 && funnelSteps[i - 1].value > 0
                ? Math.round((1 - step.value / funnelSteps[i - 1].value) * 100)
                : null;
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{step.label}</span>
                  <div className="flex items-center gap-2">
                    {dropPct !== null && (
                      <span className="text-xs text-destructive/70">-{dropPct}%</span>
                    )}
                    <span className="text-xs font-semibold text-card-foreground">
                      {step.value}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: step.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
