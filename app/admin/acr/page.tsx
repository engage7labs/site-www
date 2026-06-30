"use client";

import {
  AlertTriangle,
  Database,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AcrTag {
  name: string;
  digest: string;
  created_at: string | null;
  last_updated_at: string | null;
  can_delete: boolean;
  status: "protected" | "registry locked" | "recent" | "review required";
  protected: boolean;
  recent: boolean;
}

interface AcrManifest {
  digest: string;
  tags: string[];
  tag_details: AcrTag[];
  tags_truncated: boolean;
  size_bytes: number | null;
  created_at: string | null;
  last_updated_at: string | null;
  architecture: string | null;
  operating_system: string | null;
  related_artifact_count: number;
  can_delete: boolean;
  status: "protected" | "registry locked" | "recent" | "review required";
  protected: boolean;
  recent: boolean;
}

interface AcrRepository {
  name: string;
  created_at: string | null;
  last_updated_at: string | null;
  manifest_count: number;
  tag_count: number;
  can_delete: false;
  status: string;
  manifests: AcrManifest[];
  manifests_truncated: boolean;
}

interface AcrResponse {
  enabled: boolean;
  status?: string;
  detail?: string;
  diagnostics?: AcrDiagnostics;
  registry?: {
    name: string;
    login_server: string;
    endpoint: string;
  };
  protected_detection?: {
    configured: boolean;
    protected_ref_count: number;
    recent_protection_days: number;
  };
  limits?: {
    max_repositories: number;
    max_manifests_per_repository: number;
    max_tags_per_manifest: number;
  };
  total_count?: number;
  total_manifest_count?: number;
  total_tag_count?: number;
  total_size_bytes?: number;
  repositories_truncated?: boolean;
  repositories: AcrRepository[];
}

interface AcrDiagnostics {
  environment_label: string | null;
  configured: {
    registry_name: string | null;
    login_server: string | null;
    resource_group: string | null;
    subscription_id: string | null;
  };
  normalized: {
    registry_name: string | null;
    login_server: string | null;
    endpoint: string | null;
    endpoint_host: string | null;
  };
  normalizedRegistryName?: string | null;
  normalizedLoginServer?: string | null;
  sdkEndpointHost?: string | null;
  sdkEndpointHasHttps?: boolean;
  sdkAudience?: string;
  credentialClientIdSuffix?: string | null;
  protectedRefsCount?: number;
  protectedRepositories?: string[];
  knownImageCheckStatus?: string | null;
  catalogListingStatus?: string | null;
  expected: {
    registryName: string;
    resourceGroup: string;
    subscriptionId: string;
  } | null;
  checks: {
    registry_matches_expected: boolean | null;
    resource_group_matches_expected: boolean | null;
    subscription_matches_expected: boolean | null;
    protected_refs_configured: boolean;
    azure_identity_env_present: boolean;
    has_azure_credential?: boolean;
    managed_identity_hint_present: boolean;
  };
  missing_env: string[];
  error?: {
    detail: string;
    type: string;
    status_code: number | null;
    code: string | null;
    name: string | null;
    failure_status?: number | null;
    failure_class?: string;
    failed_step?: string;
    failureStatus?: number | null;
    failureClass?: string;
    failedStep?: string;
    safe_error_snippet?: string | null;
    safeErrorSnippet?: string | null;
  };
}

interface DeleteTarget {
  repository: string;
  target_type: "tag" | "manifest";
  tag?: string;
  digest: string;
  status: AcrTag["status"];
  recent: boolean;
  protected: boolean;
  affected_tags: string[];
  confirmation: string;
  title: string;
}

interface AcrRow {
  key: string;
  repository: AcrRepository;
  manifest: AcrManifest;
  tag: AcrTag | null;
  targetLabel: string;
  searchable: string;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function shortDigest(digest: string): string {
  if (!digest.startsWith("sha256:")) return digest;
  return `sha256:${digest.slice(7, 19)}`;
}

function statusClasses(status: AcrTag["status"]): string {
  const classes = {
    protected: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    "registry locked": "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    recent: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    "review required": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  };
  return classes[status];
}

function StatusBadge({ status }: Readonly<{ status: AcrTag["status"] }>) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusClasses(status)}`}>
      {status}
    </span>
  );
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

function checkLabel(value: boolean | null): string {
  if (value === true) return "matches";
  if (value === false) return "mismatch";
  return "not configured";
}

function acrMismatchAction(diagnostics: AcrDiagnostics): string | null {
  if (!diagnostics.expected || diagnostics.checks.registry_matches_expected !== false) {
    return null;
  }

  return `Configured ACR does not match ${diagnostics.environment_label ?? "this environment"}. Update Web runtime env to ${diagnostics.expected.registryName} before diagnosing Azure credentials.`;
}

function AcrDiagnosticsPanel({
  diagnostics,
}: Readonly<{ diagnostics?: AcrDiagnostics | null }>) {
  if (!diagnostics) return null;
  const mismatchAction = acrMismatchAction(diagnostics);

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex items-center gap-2 text-card-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <p className="font-semibold">ACR diagnostics</p>
      </div>
      <div className="mt-3 grid gap-3 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
        <p>
          <span className="text-card-foreground">Environment:</span>{" "}
          {diagnostics.environment_label ?? "-"}
        </p>
        <p>
          <span className="text-card-foreground">Configured ACR:</span>{" "}
          {diagnostics.configured.login_server ??
            diagnostics.configured.registry_name ??
            "-"}
        </p>
        <p>
          <span className="text-card-foreground">Normalized ACR:</span>{" "}
          {diagnostics.normalized?.login_server ??
            diagnostics.normalized?.registry_name ??
            "-"}
        </p>
        <p>
          <span className="text-card-foreground">Endpoint host:</span>{" "}
          {diagnostics.sdkEndpointHost ??
            diagnostics.normalized?.endpoint_host ??
            "-"}
        </p>
        <p>
          <span className="text-card-foreground">SDK endpoint HTTPS:</span>{" "}
          {diagnostics.sdkEndpointHasHttps === true
            ? "true"
            : diagnostics.sdkEndpointHasHttps === false
              ? "false"
              : "-"}
        </p>
        <p>
          <span className="text-card-foreground">SDK audience:</span>{" "}
          {diagnostics.sdkAudience?.replace(/^https:\/\//, "") ?? "-"}
        </p>
        <p>
          <span className="text-card-foreground">Expected ACR:</span>{" "}
          {diagnostics.expected?.registryName ?? "-"} (
          {checkLabel(diagnostics.checks.registry_matches_expected)})
        </p>
        <p>
          <span className="text-card-foreground">Resource group:</span>{" "}
          {diagnostics.configured.resource_group ?? "-"} (
          {checkLabel(diagnostics.checks.resource_group_matches_expected)})
        </p>
        <p>
          <span className="text-card-foreground">Subscription:</span>{" "}
          {diagnostics.configured.subscription_id ?? "-"} (
          {checkLabel(diagnostics.checks.subscription_matches_expected)})
        </p>
        <p>
          <span className="text-card-foreground">Identity hint:</span>{" "}
          {diagnostics.checks.has_azure_credential ||
          diagnostics.checks.azure_identity_env_present ||
          diagnostics.checks.managed_identity_hint_present
            ? "configured"
            : "not visible in env"}
        </p>
        <p>
          <span className="text-card-foreground">Client ID suffix:</span>{" "}
          {diagnostics.credentialClientIdSuffix ?? "-"}
        </p>
        <p>
          <span className="text-card-foreground">Protected refs:</span>{" "}
          {diagnostics.protectedRefsCount ?? 0}
        </p>
        <p>
          <span className="text-card-foreground">Known repositories:</span>{" "}
          {diagnostics.protectedRepositories?.join(", ") || "-"}
        </p>
        <p>
          <span className="text-card-foreground">Known image check:</span>{" "}
          {diagnostics.knownImageCheckStatus ?? "-"}
        </p>
        <p>
          <span className="text-card-foreground">Catalog listing:</span>{" "}
          {diagnostics.catalogListingStatus ?? "-"}
        </p>
      </div>
      {diagnostics.missing_env.length > 0 && (
        <p className="mt-3 text-xs text-amber-300">
          Missing config: {diagnostics.missing_env.join(", ")}
        </p>
      )}
      {mismatchAction && (
        <p className="mt-3 text-xs text-amber-300">{mismatchAction}</p>
      )}
      {diagnostics.error && (
        <p className="mt-3 text-xs text-destructive">
          Azure failure: {diagnostics.error.type}
          {diagnostics.error.status_code
            ? ` (${diagnostics.error.status_code})`
            : ""}
          {diagnostics.error.failedStep || diagnostics.error.failed_step
            ? ` at ${diagnostics.error.failedStep ?? diagnostics.error.failed_step}`
            : ""}
          {diagnostics.error.code ? ` · ${diagnostics.error.code}` : ""}
          {diagnostics.error.safeErrorSnippet || diagnostics.error.safe_error_snippet
            ? ` · ${diagnostics.error.safeErrorSnippet ?? diagnostics.error.safe_error_snippet}`
            : ""}
        </p>
      )}
    </div>
  );
}

export default function AdminAcrPage() {
  const [data, setData] = useState<AcrResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDiagnostics, setErrorDiagnostics] =
    useState<AcrDiagnostics | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledgeUnknown, setAcknowledgeUnknown] = useState(false);
  const [overrideRecent, setOverrideRecent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setErrorDiagnostics(null);
    try {
      const response = await fetch("/api/proxy/admin/acr", { cache: "no-store" });
      const payload = (await response.json()) as
        | AcrResponse
        | { detail?: unknown; diagnostics?: AcrDiagnostics };
      if (!payload || typeof payload !== "object" || !response.ok || !("repositories" in payload)) {
        setErrorDiagnostics(
          payload && typeof payload === "object" && "diagnostics" in payload
            ? (payload.diagnostics ?? null)
            : null
        );
        throw new Error(detailFromPayload(payload) ?? `ACR load failed: ${response.status}`);
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ACR load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo<AcrRow[]>(() => {
    const needle = query.trim().toLowerCase();
    return (data?.repositories ?? []).flatMap((repository) =>
      repository.manifests.flatMap((manifest) => {
        const tagRows: AcrRow[] = manifest.tag_details.map((tagDetail) => ({
          key: `${repository.name}:${tagDetail.name}`,
          repository,
          manifest,
          tag: tagDetail,
          targetLabel: `${repository.name}:${tagDetail.name}`,
          searchable: `${repository.name} ${tagDetail.name} ${tagDetail.digest} ${manifest.digest}`.toLowerCase(),
        }));

        if (tagRows.length > 0) return tagRows;
        return [
          {
            key: `${repository.name}@${manifest.digest}`,
            repository,
            manifest,
            tag: null,
            targetLabel: `${repository.name}@${shortDigest(manifest.digest)}`,
            searchable: `${repository.name} ${manifest.digest}`.toLowerCase(),
          },
        ];
      })
    ).filter((row) => !needle || row.searchable.includes(needle));
  }, [data?.repositories, query]);

  function openTagDelete(repository: AcrRepository, tagDetail: AcrTag) {
    const confirmationText = `delete ${repository.name}:${tagDetail.name}`;
    setDeleteTarget({
      repository: repository.name,
      target_type: "tag",
      tag: tagDetail.name,
      digest: tagDetail.digest,
      status: tagDetail.status,
      recent: tagDetail.recent,
      protected: tagDetail.protected,
      affected_tags: [tagDetail.name],
      confirmation: confirmationText,
      title: `${repository.name}:${tagDetail.name}`,
    });
    setConfirmation("");
    setAcknowledgeUnknown(false);
    setOverrideRecent(false);
    setDeleteError(null);
  }

  function openManifestDelete(repository: AcrRepository, manifest: AcrManifest) {
    const confirmationText = `delete ${repository.name}@${manifest.digest}`;
    setDeleteTarget({
      repository: repository.name,
      target_type: "manifest",
      digest: manifest.digest,
      status: manifest.status,
      recent: manifest.recent,
      protected: manifest.protected,
      affected_tags: manifest.tags,
      confirmation: confirmationText,
      title: `${repository.name}@${shortDigest(manifest.digest)}`,
    });
    setConfirmation("");
    setAcknowledgeUnknown(false);
    setOverrideRecent(false);
    setDeleteError(null);
  }

  async function deleteSelected() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/proxy/admin/acr", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: deleteTarget.repository,
          target_type: deleteTarget.target_type,
          tag: deleteTarget.tag,
          digest: deleteTarget.digest,
          confirmation,
          final_confirm: true,
          acknowledge_deployed_unknown: acknowledgeUnknown,
          override_recent: overrideRecent,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(detailFromPayload(payload) ?? `Delete failed: ${response.status}`);
      }
      setMessage(`Deleted ${deleteTarget.title}.`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading ACR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-destructive">{error}</p>
        <div className="w-full max-w-4xl">
          <AcrDiagnosticsPanel diagnostics={errorDiagnostics} />
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
    );
  }

  if (!data || !data.enabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Database className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {data?.detail ?? "Azure Container Registry is not configured in this environment."}
        </p>
        <div className="w-full max-w-4xl">
          <AcrDiagnosticsPanel diagnostics={data?.diagnostics} />
        </div>
      </div>
    );
  }

  const detectionConfigured = data.protected_detection?.configured === true;
  const recentProtectionDays = data.protected_detection?.recent_protection_days ?? 14;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ACR</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.registry?.login_server ?? "Container Registry"}
            {data.status ? ` · ${data.status}` : ""}
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

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Repositories</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{data.total_count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Manifests</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">
            {data.total_manifest_count ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Tags</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">
            {data.total_tag_count ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Size Listed</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">
            {formatBytes(data.total_size_bytes)}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            detectionConfigured
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">Deployed Refs</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
            {detectionConfigured ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                configured
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                manual check
              </>
            )}
          </p>
        </div>
      </div>

      {!detectionConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Currently deployed image detection is not configured for this Web environment. Deletes
            require an extra acknowledgement.
          </p>
        </div>
      )}

      {(data.repositories_truncated || data.repositories.some((repo) => repo.manifests_truncated)) && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          ACR results were limited by the configured page caps.
        </div>
      )}

      <AcrDiagnosticsPanel diagnostics={data.diagnostics} />

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <Layers className="h-4 w-4" />
            Image references
          </div>
          <label className="relative block w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repository, tag, digest"
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No ACR images matched.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Digest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const tagDetail = row.tag;
                  const status = tagDetail?.status ?? row.manifest.status;
                  const canDelete = tagDetail
                    ? tagDetail.can_delete
                    : row.manifest.can_delete;
                  const updatedAt = tagDetail?.last_updated_at ?? row.manifest.last_updated_at;
                  return (
                    <tr key={row.key}>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {tagDetail ? (
                            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0">
                            <p className="break-all font-mono text-xs text-card-foreground">
                              {row.targetLabel}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {row.repository.manifest_count} manifest
                              {row.repository.manifest_count === 1 ? "" : "s"} /{" "}
                              {row.repository.tag_count} tag
                              {row.repository.tag_count === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {shortDigest(tagDetail?.digest ?? row.manifest.digest)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatBytes(row.manifest.size_bytes)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {tagDetail && (
                            <button
                              type="button"
                              disabled={!canDelete}
                              onClick={() => openTagDelete(row.repository, tagDetail)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 text-xs font-medium text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Tag
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!row.manifest.can_delete}
                            onClick={() => openManifestDelete(row.repository, row.manifest)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 text-xs font-medium text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Manifest
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Status</p>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
          <p><span className="text-emerald-400">protected</span> configured as deployed/current</p>
          <p><span className="text-sky-400">recent</span> updated inside {recentProtectionDays} days</p>
          <p><span className="text-amber-400">review required</span> deletion may be possible after review</p>
          <p><span className="text-zinc-300">registry locked</span> ACR delete flag is disabled</p>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">
                  Delete {deleteTarget.target_type}
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {deleteTarget.title}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p><span className="text-foreground">Repository:</span> {deleteTarget.repository}</p>
              <p><span className="text-foreground">Digest:</span> {shortDigest(deleteTarget.digest)}</p>
              <p><span className="text-foreground">Status:</span> {deleteTarget.status}</p>
              <p><span className="text-foreground">Tags:</span> {deleteTarget.affected_tags.join(", ") || "-"}</p>
            </div>

            {!detectionConfigured && (
              <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                <input
                  type="checkbox"
                  checked={acknowledgeUnknown}
                  onChange={(event) => setAcknowledgeUnknown(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  Deployed image detection is not configured, and I checked this reference outside
                  the Admin Portal.
                </span>
              </label>
            )}

            {deleteTarget.recent && (
              <label className="mt-3 flex items-start gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
                <input
                  type="checkbox"
                  checked={overrideRecent}
                  onChange={(event) => setOverrideRecent(event.target.checked)}
                  className="mt-1"
                />
                <span>This image is recent, and I still want to delete this exact reference.</span>
              </label>
            )}

            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Type <span className="font-mono text-foreground">{deleteTarget.confirmation}</span>
              </p>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-border bg-card px-3 font-mono text-sm text-foreground outline-none focus:border-destructive"
              />
            </div>

            {deleteError && <p className="mt-3 text-sm text-destructive">{deleteError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-card-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteSelected()}
                disabled={
                  deleting ||
                  confirmation !== deleteTarget.confirmation ||
                  (!detectionConfigured && !acknowledgeUnknown) ||
                  (deleteTarget.recent && !overrideRecent)
                }
                className="inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete exact reference"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
