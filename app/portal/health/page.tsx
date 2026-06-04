"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { DarthStatePanel } from "@/components/portal/darth-state-panel";
import { trackHealthDashboardViewed } from "@/lib/telemetry";
import { Activity, ArrowRight, HeartPulse, Moon } from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";

type HealthDomain = "sleep" | "recovery" | "activity";
type JsonScalar = string | number | boolean | null;
type UnknownRecord = Record<string, unknown>;

interface HealthPoint {
  date: string;
  [key: string]: JsonScalar;
}

interface HealthDataResponse {
  analysis_count: number;
  latest_sections: unknown;
  data_points: HealthPoint[];
}

const DOMAIN_KEYS: Record<HealthDomain, string[]> = {
  sleep: ["sleep_hours"],
  recovery: [
    "recovery_composite_score",
    "hrv_sdnn_mean",
    "hrv_sdnn_mean_median",
    "hrv_sdnn",
    "hrv",
  ],
  activity: ["total_steps", "steps"],
};

const DOMAIN_META = {
  sleep: {
    href: "/portal/health/sleep",
    Icon: Moon,
    accent: "#3dbe73",
  },
  recovery: {
    href: "/portal/health/recovery",
    Icon: HeartPulse,
    accent: "#6366f1",
  },
  activity: {
    href: "/portal/health/activity",
    Icon: Activity,
    accent: "#f97316",
  },
} satisfies Record<
  HealthDomain,
  { href: string; Icon: ElementType; accent: string }
>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload(value: unknown): UnknownRecord | null {
  if (Array.isArray(value)) return unwrapPayload(value[0]);
  return isRecord(value) ? value : null;
}

function normaliseSections(sections: unknown): UnknownRecord | null {
  const root = unwrapPayload(sections);
  if (!root) return null;
  return {
    ...root,
    sleep_stages: unwrapPayload(root.sleep_stages) ?? root.sleep_stages,
    recovery_signals:
      unwrapPayload(root.recovery_signals) ?? root.recovery_signals,
    activity_signals:
      unwrapPayload(root.activity_signals) ?? root.activity_signals,
    body_context: unwrapPayload(root.body_context) ?? root.body_context,
    darth: unwrapPayload(root.darth) ?? root.darth,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function valueFor(point: HealthPoint, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(point[key]);
    if (value !== null) return value;
  }
  return null;
}

function parseDate(value: string): Date | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (iso) {
    return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateTime(point: HealthPoint): number {
  return parseDate(point.date)?.getTime() ?? 0;
}

function formatDisplayDate(value: string, locale: string): string {
  const parsed = parseDate(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-IE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function latestDomainPoint(
  points: HealthPoint[],
  domain: HealthDomain,
): HealthPoint | null {
  return [...points]
    .filter((point) => parseDate(point.date))
    .sort((a, b) => dateTime(b) - dateTime(a))
    .find((point) => valueFor(point, DOMAIN_KEYS[domain]) !== null) ?? null;
}

function domainValue(
  domain: HealthDomain,
  point: HealthPoint | null,
  strings: {
    notAvailable: string;
    stepsUnit: string;
  },
): string {
  if (!point) return strings.notAvailable;
  const value = valueFor(point, DOMAIN_KEYS[domain]);
  if (value === null) return strings.notAvailable;
  if (domain === "sleep") return `${Number(value.toFixed(1))}h`;
  if (domain === "recovery") return `${Math.round(value)}`;
  return `${Math.round(value).toLocaleString()} ${strings.stepsUnit}`;
}

export default function HealthPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<HealthDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    trackHealthDashboardViewed("overview");
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/proxy/users/portal-health-data");
        if (!res.ok) throw new Error(`Portal health data failed: ${res.status}`);
        const payload = (await res.json()) as HealthDataResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () => normaliseSections(data?.latest_sections),
    [data?.latest_sections],
  );
  const points = data?.data_points ?? [];
  const latestAnyPoint = [...points]
    .filter((point) => parseDate(point.date))
    .sort((a, b) => dateTime(b) - dateTime(a))[0];

  if (loading) {
    return (
      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-6">
        <p className="text-sm text-muted-foreground">{t.portal.health.loading}</p>
      </div>
    );
  }

  if (error || !data || data.analysis_count === 0) {
    return (
      <div className="portal-panel rounded-lg border border-border/70 bg-card/85 p-8 text-center">
        <p className="text-sm font-medium text-card-foreground">
          {t.portal.health.unableToLoad}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {error ? t.portal.health.loadError : t.portal.health.overviewNoData}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="portal-panel rounded-lg border border-border/70 bg-card/85 p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t.portal.health.overviewTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {t.portal.health.overviewSubtitle}
          </p>
          {latestAnyPoint && (
            <p className="text-xs text-muted-foreground">
              {t.portal.health.overviewUpdatedThrough.replace(
                "{date}",
                formatDisplayDate(latestAnyPoint.date, locale),
              )}
            </p>
          )}
        </div>
      </section>

      <DarthStatePanel sections={sections} />

      <div className="grid gap-4 lg:grid-cols-3">
        {(["sleep", "recovery", "activity"] as const).map((domain) => {
          const meta = DOMAIN_META[domain];
          const copy = t.portal.health.domains[domain];
          const latest = latestDomainPoint(points, domain);
          const { Icon } = meta;

          return (
            <Link
              key={domain}
              href={meta.href}
              className="portal-panel group flex min-h-52 flex-col justify-between rounded-lg border border-border/70 bg-card/85 p-5 transition-colors hover:border-accent/45"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${meta.accent}18`,
                    color: meta.accent,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-card-foreground">
                    {copy.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.portal.health.overviewLatestValidDay[domain]}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-card-foreground">
                    {domainValue(domain, latest, {
                      notAvailable: t.common.notAvailable,
                      stepsUnit: t.portal.health.stepsUnit,
                    })}
                  </p>
                  {latest && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDisplayDate(latest.date, locale)}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                  {t.portal.health.overviewOpenDetail}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {t.portal.health.overviewHelper}
      </p>
    </div>
  );
}
