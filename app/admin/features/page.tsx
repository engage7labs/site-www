"use client";

import {
  Cpu,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AdminFeature {
  feature_key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout_targets: string[];
  classification: string;
  surface: string;
  safe_metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

interface AiConfig {
  enabled: boolean;
  provider: string;
  model: string;
  allowed_models: string[];
  max_input_chars: number;
  max_output_tokens: number;
  timeout_ms: number;
  daily_admin_budget: number;
  has_provider_key: boolean;
  key_visible: false;
  model_selection: string;
}

interface AdminFeaturesResponse {
  features: AdminFeature[];
  rollout_targets: string[];
  ai_config: AiConfig;
}

function labelForTarget(target: string): string {
  return {
    admin: "Admin",
    premium_free: "Premium Free",
    premium: "Premium",
    super_premium: "Super Premium",
  }[target] ?? target;
}

function detailFromPayload(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }
  return null;
}

function FeatureRow({
  feature,
  rolloutTargets,
  onSaved,
}: Readonly<{
  feature: AdminFeature;
  rolloutTargets: string[];
  onSaved: (data: AdminFeaturesResponse) => void;
}>) {
  const [enabled, setEnabled] = useState(feature.enabled);
  const [targets, setTargets] = useState<string[]>(feature.rollout_targets);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(feature.enabled);
    setTargets(feature.rollout_targets);
  }, [feature]);

  const dirty = enabled !== feature.enabled || targets.join("|") !== feature.rollout_targets.join("|");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/features/${feature.feature_key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, rollout_targets: targets }),
      });
      const data = (await res.json()) as AdminFeaturesResponse | { detail?: unknown };
      if (!res.ok || !("features" in data || "feature" in data)) {
        throw new Error(detailFromPayload(data) ?? `Save failed: ${res.status}`);
      }
      const refreshed = await fetch("/api/proxy/admin/features");
      const refreshedData = (await refreshed.json()) as AdminFeaturesResponse;
      if (!refreshed.ok) throw new Error(`Refresh failed: ${refreshed.status}`);
      onSaved(refreshedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleTarget(target: string) {
    setTargets((current) =>
      current.includes(target)
        ? current.filter((item) => item !== target)
        : [...current, target].filter((item, index, all) => all.indexOf(item) === index)
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-card-foreground">
              {feature.label}
            </h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {feature.classification}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {feature.surface}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {feature.description}
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-card-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Enabled
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {rolloutTargets.map((target) => (
          <label
            key={target}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-xs text-card-foreground"
          >
            <input
              type="checkbox"
              checked={targets.includes(target)}
              onChange={() => toggleTarget(target)}
              className="h-3.5 w-3.5 accent-primary"
            />
            {labelForTarget(target)}
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && dirty && (
          <p className="text-xs text-muted-foreground">Unsaved changes</p>
        )}
      </div>
    </div>
  );
}

export default function AdminFeaturesPage() {
  const [data, setData] = useState<AdminFeaturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/admin/features");
      const payload = (await res.json()) as AdminFeaturesResponse | { detail?: unknown };
      if (!res.ok || !("features" in payload)) {
        throw new Error(detailFromPayload(payload) ?? `Load failed: ${res.status}`);
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const aiConfig = data?.ai_config;
  const aiFeature = useMemo(
    () => data?.features.find((feature) => feature.feature_key === "ai_darth_health_overview_narrative"),
    [data?.features]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading features...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-destructive">{error ?? "Features unavailable"}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-card-foreground hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Features</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rollout targets and AI runtime status
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-card-foreground hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {aiConfig && (
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI status
              </p>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-card-foreground">
              {aiConfig.enabled ? "Enabled" : "Disabled"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Provider key {aiConfig.has_provider_key ? "configured" : "missing"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Provider
              </p>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-card-foreground">
              {aiConfig.provider}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{aiConfig.model}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Caps
              </p>
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-card-foreground">
              {aiConfig.max_input_chars.toLocaleString()} chars
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {aiConfig.max_output_tokens} output tokens
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Daily budget
              </p>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-card-foreground">
              {aiConfig.daily_admin_budget}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(aiConfig.timeout_ms / 1000)}s timeout
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {data.features.map((feature) => (
          <FeatureRow
            key={feature.feature_key}
            feature={feature}
            rolloutTargets={data.rollout_targets}
            onSaved={(nextData) => setData(nextData)}
          />
        ))}
        {!aiFeature && (
          <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            AI DARTH Health Overview policy not found.
          </div>
        )}
      </div>
    </div>
  );
}
