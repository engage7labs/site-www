"use client";

import { Clock, Crown, ExternalLink, Heart, Moon, Upload } from "lucide-react";
import { useEffect, useState } from "react";

interface OverviewData {
  plan: string;
  trial_end_at: string | null;
  uploads: number;
  sleep_score: number | null;
  recovery_trend: number | null;
  data_completeness: string | null;
  latest_analysis: {
    job_id: string;
    created_at: string | null;
    report_label: string | null;
    summary: Record<string, unknown> | null;
    highlights: string[] | null;
  } | null;
}

interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ElementType;
  readonly subtitle?: string;
}

function MetricCard({ label, value, icon: Icon, subtitle }: MetricCardProps) {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-xl font-bold text-card-foreground">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function ShareCard() {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
      <div className="flex items-center gap-3">
        <ExternalLink className="h-5 w-5 text-accent" />
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Share Engage7
          </h3>
          <p className="text-xs text-muted-foreground">
            Share the product homepage with friends — not your data.
          </p>
        </div>
        <a
          href="https://www.engage7.ie"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Share
        </a>
      </div>
    </div>
  );
}

function planLabel(plan: string): string {
  if (plan === "trial_start") return "Getting Started";
  if (plan === "trial") return "Premium Trial";
  if (plan === "premium") return "Premium";
  if (plan === "expired") return "Expired";
  return plan;
}

export default function PortalOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proxy/users/portal-overview");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const plan = data?.plan ?? "trial";
  const uploads = data?.uploads ?? 0;
  const sleepScore = data?.sleep_score != null ? `${data.sleep_score}h` : "—";
  const recoveryTrend =
    data?.recovery_trend != null ? `${data.recovery_trend} ms` : "—";
  const completeness = data?.data_completeness ?? "—";
  const latest = data?.latest_analysis;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your health data at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Plan"
          value={planLabel(plan)}
          icon={Crown}
          subtitle={
            data?.trial_end_at
              ? `Until ${new Date(data.trial_end_at).toLocaleDateString()}`
              : undefined
          }
        />
        <MetricCard
          label="Sleep Score"
          value={sleepScore}
          icon={Moon}
          subtitle={uploads > 0 ? "Median from latest" : "Upload data to see"}
        />
        <MetricCard
          label="Recovery (HRV)"
          value={recoveryTrend}
          icon={Heart}
          subtitle={uploads > 0 ? "Median HRV from latest" : "Requires uploads"}
        />
        <MetricCard
          label="Data Completeness"
          value={completeness}
          icon={Clock}
          subtitle={uploads > 0 ? "Signal coverage" : "No uploads yet"}
        />
        <MetricCard
          label="Uploads"
          value={String(uploads)}
          icon={Upload}
          subtitle={uploads > 0 ? "Total analyses" : "Start by uploading"}
        />
      </div>

      <ShareCard />

      {latest ? (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Latest Analysis
          </h2>
          {latest.created_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(latest.created_at).toLocaleDateString("en-IE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {latest.highlights && latest.highlights.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {latest.highlights.map((h: string, i: number) => (
                <li
                  key={`hl-${i}`}
                  className="flex items-start gap-2 text-sm text-card-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Analysis data available. Explore Trends and Reports for details.
            </p>
          )}
          {latest.summary && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {!!latest.summary.dataset_start &&
                !!latest.summary.dataset_end && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-card-foreground">
                      Period:{" "}
                    </span>
                    {String(latest.summary.dataset_start)} →{" "}
                    {String(latest.summary.dataset_end)}
                  </div>
                )}
              {latest.summary.days != null && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-card-foreground">
                    Days:{" "}
                  </span>
                  {String(latest.summary.days)}
                </div>
              )}
              {latest.summary.total_rows != null && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-card-foreground">
                    Records:{" "}
                  </span>
                  {Number(latest.summary.total_rows).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Recent Analyses
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No analyses yet. Upload an Apple Health export to get started.
          </p>
        </div>
      )}
    </div>
  );
}
