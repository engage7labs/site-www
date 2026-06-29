"use client";

import { Eye, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface AiArtifactSummary {
  id: number;
  created_at: string | null;
  feature_key: string;
  provider: string;
  model: string;
  locale: string;
  user_profile_type: string | null;
  user_plan: string | null;
  gate_mode: string;
  validation_status: string;
  would_pass_restricted: boolean;
  validation_warning_codes: string[];
  validation_error_codes: string[];
  approx_input_tokens: number | null;
  approx_output_tokens: number | null;
  input_contract_version: string | null;
  input_evidence_pack_hash: string | null;
  analysis_id: number | null;
  orphan_status: string;
  orphan_reason: string;
  is_orphan_candidate: boolean;
}

interface AiArtifactsResponse {
  artifacts: AiArtifactSummary[];
  total: number;
  limit: number;
  offset: number;
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

function fmtDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function joinCodes(values: string[]): string {
  return values.length ? values.join(", ") : "-";
}

function statusClass(status: string): string {
  if (status === "passed") return "border-emerald-500/30 text-emerald-400";
  if (status === "warning") return "border-amber-500/30 text-amber-300";
  return "border-red-500/30 text-red-400";
}

function orphanClass(candidate: boolean): string {
  return candidate ? "border-red-500/30 text-red-400" : "border-emerald-500/30 text-emerald-400";
}

export default function AdminAiArtifactsPage() {
  const [data, setData] = useState<AiArtifactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState("");
  const [gateMode, setGateMode] = useState("");
  const [featureKey, setFeatureKey] = useState("");
  const [offset, setOffset] = useState(0);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const limit = 25;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (validationStatus) params.set("validation_status", validationStatus);
    if (gateMode) params.set("gate_mode", gateMode);
    if (featureKey.trim()) params.set("feature_key", featureKey.trim());
    return params.toString();
  }, [featureKey, gateMode, offset, validationStatus]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/ai-artifacts?${query}`);
      const payload = (await res.json()) as AiArtifactsResponse | { detail?: unknown };
      if (!res.ok || !("artifacts" in payload)) {
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
  }, [query]);

  const canPrev = offset > 0;
  const canNext = data ? offset + limit < data.total : false;

  const syncHorizontalScroll = (source: "top" | "table") => {
    const from = source === "top" ? topScrollRef.current : tableScrollRef.current;
    const to = source === "top" ? tableScrollRef.current : topScrollRef.current;
    if (!from || !to || to.scrollLeft === from.scrollLeft) return;
    to.scrollLeft = from.scrollLeft;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Artifacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-only read-only generation artifact inspection
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

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Status
          <select
            value={validationStatus}
            onChange={(event) => {
              setOffset(0);
              setValidationStatus(event.target.value);
            }}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-card-foreground"
          >
            <option value="">All</option>
            <option value="passed">Passed</option>
            <option value="warning">Warning</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Gate
          <select
            value={gateMode}
            onChange={(event) => {
              setOffset(0);
              setGateMode(event.target.value);
            }}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-card-foreground"
          >
            <option value="">All</option>
            <option value="monitor">Monitor</option>
            <option value="restricted">Restricted</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground md:col-span-2">
          Feature
          <input
            value={featureKey}
            onChange={(event) => {
              setOffset(0);
              setFeatureKey(event.target.value);
            }}
            placeholder="ai_darth_health_overview_narrative"
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-card-foreground"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div
          ref={topScrollRef}
          className="overflow-x-auto border-b border-border bg-muted/20"
          onScroll={() => syncHorizontalScroll("top")}
          aria-label="AI artifacts horizontal scroll"
        >
          <div className="h-2 min-w-[1280px]" />
        </div>
        <div
          ref={tableScrollRef}
          className="overflow-x-auto"
          onScroll={() => syncHorizontalScroll("table")}
        >
        <table className="min-w-[1280px] w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Gate</th>
              <th className="px-4 py-3 font-medium">Restricted</th>
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 font-medium">Provider/model</th>
              <th className="px-4 py-3 font-medium">Locale</th>
              <th className="px-4 py-3 font-medium">Profile/plan</th>
              <th className="px-4 py-3 font-medium">Codes</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">Lifecycle</th>
              <th className="sticky right-0 bg-card px-4 py-3 font-medium shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.8)]">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                  Loading artifacts...
                </td>
              </tr>
            )}
            {!loading &&
              data?.artifacts.map((artifact) => (
                <tr key={artifact.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-card-foreground">{fmtDate(artifact.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(artifact.validation_status)}`}>
                      {artifact.validation_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-card-foreground">{artifact.gate_mode}</td>
                  <td className="px-4 py-3 text-card-foreground">
                    {artifact.would_pass_restricted ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-card-foreground">{artifact.feature_key}</td>
                  <td className="px-4 py-3 text-card-foreground">
                    {artifact.provider} / {artifact.model}
                  </td>
                  <td className="px-4 py-3 text-card-foreground">{artifact.locale}</td>
                  <td className="px-4 py-3 text-card-foreground">
                    {artifact.user_profile_type ?? "-"} / {artifact.user_plan ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-card-foreground">
                    <div className="max-w-[180px] truncate" title={[...artifact.validation_warning_codes, ...artifact.validation_error_codes].join(", ")}>
                      {joinCodes([...artifact.validation_warning_codes, ...artifact.validation_error_codes])}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-card-foreground">
                    {(artifact.approx_input_tokens ?? 0).toLocaleString()} / {(artifact.approx_output_tokens ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${orphanClass(artifact.is_orphan_candidate)}`}
                      title={artifact.orphan_reason}
                    >
                      {artifact.is_orphan_candidate ? "orphan candidate" : "valid historical/current"}
                    </span>
                  </td>
                  <td className="sticky right-0 bg-card px-4 py-3 shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.8)]">
                    <Link
                      href={`/admin/ai-artifacts/${artifact.id}`}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-accent hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            {!loading && data?.artifacts.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                  No artifacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data ? `${Math.min(offset + 1, data.total)}-${Math.min(offset + limit, data.total)} of ${data.total}` : "-"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setOffset((current) => Math.max(0, current - limit))}
            className="h-9 rounded-md border border-border px-3 text-card-foreground disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setOffset((current) => current + limit)}
            className="h-9 rounded-md border border-border px-3 text-card-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
