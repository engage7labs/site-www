"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

interface AiArtifactDetail {
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
  provider_output_structured_json: unknown;
  normalized_output_json: unknown;
  rendered_output_json: unknown;
  transformation_trace_json: unknown;
  validation_warnings_json: unknown;
  validation_errors_json: unknown;
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

function JsonSection({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
      <pre className="mt-3 max-h-[420px] overflow-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-card-foreground">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </section>
  );
}

export default function AdminAiArtifactDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id: artifactId } = use(params);
  const [artifact, setArtifact] = useState<AiArtifactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/ai-artifacts/${id}`);
      const payload = (await res.json()) as
        | { artifact: AiArtifactDetail }
        | { detail?: unknown };
      if (!res.ok || !("artifact" in payload)) {
        throw new Error(detailFromPayload(payload) ?? `Load failed: ${res.status}`);
      }
      setArtifact(payload.artifact);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(artifactId);
  }, [artifactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading artifact...</p>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-destructive">{error ?? "Artifact unavailable"}</p>
        <Link
          href="/admin/ai-artifacts"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-card-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
    );
  }

  const metadata = [
    ["Created", fmtDate(artifact.created_at)],
    ["Feature", artifact.feature_key],
    ["Provider/model", `${artifact.provider} / ${artifact.model}`],
    ["Locale", artifact.locale],
    ["Profile/plan", `${artifact.user_profile_type ?? "-"} / ${artifact.user_plan ?? "-"}`],
    ["Gate", artifact.gate_mode],
    ["Status", artifact.validation_status],
    ["Would pass restricted", artifact.would_pass_restricted ? "Yes" : "No"],
    ["Analysis ID", artifact.analysis_id?.toString() ?? "-"],
    ["Contract", artifact.input_contract_version ?? "-"],
    ["Evidence Pack hash", artifact.input_evidence_pack_hash ?? "-"],
    [
      "Tokens",
      `${artifact.approx_input_tokens ?? 0} input / ${artifact.approx_output_tokens ?? 0} output`,
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/ai-artifacts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            AI artifacts
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground">
            Artifact #{artifact.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-only read-only view. Forbidden raw prompt, raw Evidence Pack, IDs, paths, and secrets are not rendered.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(artifactId)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-card-foreground hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Safe metadata</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {metadata.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
              <p className="mt-1 break-words text-sm text-card-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <JsonSection title="Rendered output" value={artifact.rendered_output_json} />
      <JsonSection title="Normalized output" value={artifact.normalized_output_json} />
      <JsonSection
        title="Structured provider output"
        value={artifact.provider_output_structured_json}
      />
      <JsonSection title="Transformation trace" value={artifact.transformation_trace_json} />
      <JsonSection title="Validation warnings" value={artifact.validation_warnings_json} />
      <JsonSection title="Validation errors" value={artifact.validation_errors_json} />
    </div>
  );
}
