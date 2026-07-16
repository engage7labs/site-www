"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Activity, CircleAlert, CircleCheck, CircleHelp, Database, RefreshCw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type Availability = "available" | "no_recent_data" | "not_available";
type MetricKey = "sleep" | "heart_rate" | "resting_heart_rate" | "hrv" | "steps" | "active_energy" | "distance" | "active_minutes" | "oxygen_saturation" | "respiratory_rate" | "vo2_max";

interface MetricSource {
  source_id: string;
  source_application: string | null;
  source_device: string | null;
  acquisition_method: "apple_health_export";
  last_synchronized_at: string | null;
  confidence: null;
  provenance: null;
}

interface MetricSourceItem {
  metric_key: MetricKey;
  availability: Availability;
  last_observed_at: string | null;
  sources: MetricSource[];
}

interface SourcesResponse {
  analysis_count: number;
  metric_sources?: {
    contract_version: "metric_sources.v1";
    metrics: MetricSourceItem[];
  };
}

function formatDate(value: string | null, locale: string, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

const STATUS_STYLES: Record<Availability, string> = {
  available: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  no_recent_data: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  not_available: "border-border bg-muted/55 text-muted-foreground",
};

export default function SourcesPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/proxy/users/portal-health-data", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as SourcesResponse;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6 text-sm text-muted-foreground">{t.portal.sources.loading}</div>;
  }

  if (error) {
    return (
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
        <CircleAlert className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-3 font-semibold text-card-foreground">{t.portal.sources.loadErrorTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.portal.sources.loadError}</p>
      </div>
    );
  }

  const metrics = data?.metric_sources?.metrics ?? [];
  if (!data?.analysis_count || metrics.length === 0) {
    return (
      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-8 text-center">
        <Database className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 font-semibold text-card-foreground">{t.portal.sources.emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{t.portal.sources.empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="portal-panel rounded-xl border border-border/70 bg-card/85 p-5 sm:p-6">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Database className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">{t.portal.sources.introTitle}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.portal.sources.intro}</p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">{t.portal.sources.transparencyNote}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const StatusIcon = metric.availability === "available" ? CircleCheck : metric.availability === "no_recent_data" ? CircleAlert : CircleHelp;
          return (
            <article key={metric.metric_key} className="portal-panel flex min-w-0 flex-col rounded-xl border border-border/70 bg-card/85 p-5">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Activity className="h-4 w-4" /></div>
                  <h3 className="font-semibold text-card-foreground">{t.portal.sources.metrics[metric.metric_key]}</h3>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[metric.availability]}`}>
                  <StatusIcon className="h-3.5 w-3.5" />{t.portal.sources.statuses[metric.availability]}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-border/60 pt-4">
                {metric.sources.map((source) => (
                  <dl key={source.source_id} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Database className="h-3.5 w-3.5" />{t.portal.sources.source}</dt>
                      <dd className="mt-1 text-sm font-medium text-card-foreground">{source.source_application ?? t.portal.sources.unknown}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Smartphone className="h-3.5 w-3.5" />{t.portal.sources.device}</dt>
                      <dd className="mt-1 text-sm font-medium text-card-foreground">{source.source_device ?? t.portal.sources.unknown}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t.portal.sources.acquisition}</dt>
                      <dd className="mt-1 text-sm font-medium text-card-foreground">{t.portal.sources.acquisitionMethods[source.acquisition_method]}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" />{t.portal.sources.lastSynchronized}</dt>
                      <dd className="mt-1 text-sm font-medium text-card-foreground">{formatDate(source.last_synchronized_at, locale, t.portal.sources.never)}</dd>
                    </div>
                  </dl>
                ))}
                <dl>
                  <dt className="text-xs text-muted-foreground">{t.portal.sources.lastObserved}</dt>
                  <dd className="mt-1 text-sm font-medium text-card-foreground">{formatDate(metric.last_observed_at, locale, t.portal.sources.never)}</dd>
                </dl>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
