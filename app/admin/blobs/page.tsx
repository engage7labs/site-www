"use client";

import { useEffect, useState } from "react";
import { Trash2, RefreshCw, HardDrive, AlertTriangle } from "lucide-react";

interface BlobEntry {
  blob_path: string;
  job_id: string;
  size_bytes: number;
  last_modified: string | null;
  container: string;
  is_orphan: boolean;
  status?: "linked" | "user-owned" | "public active" | "public expired" | "unmatched" | "orphan" | "protected";
}

interface BlobsResponse {
  enabled: boolean;
  blobs: BlobEntry[];
  orphans: BlobEntry[];
  total_count: number;
  orphan_count: number;
  total_size_bytes: number;
  orphan_size_bytes: number;
}

interface HandoffDiagnostics {
  job_id: string;
  job_status: string;
  handoff_status: string;
  matched_existing_protected_footprint: boolean;
  feature_csv_available: boolean;
  reason_code: string;
  fallback_to_normal_unlock_due_to_missing_artifact: boolean;
  matched_users: Array<{
    user_id: string;
    email: string;
    footprint_hash_prefix: string | null;
    confidence: number | null;
    reason_codes: string[];
    decision_status: string;
  }>;
  safe_summary: {
    date_range?: { start?: string; end?: string } | null;
    domain_profile?: Record<string, unknown> | null;
    status?: string | null;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminBlobsPage() {
  const [data, setData] = useState<BlobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [pageSize, setPageSize] = useState<20 | 50 | 100 | "all">(20);
  const [page, setPage] = useState(1);
  const [diagnosticJobId, setDiagnosticJobId] = useState("");
  const [diagnostics, setDiagnostics] = useState<HandoffDiagnostics | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/proxy/admin/blobs")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<BlobsResponse>;
      })
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [showAll, pageSize]);

  const handleDelete = async (container: string, blobPath: string) => {
    const key = `${container}/${blobPath}`;
    setDeleting(key);
    try {
      const res = await fetch(
        `/api/proxy/admin/blobs?container=${encodeURIComponent(container)}&blob_path=${encodeURIComponent(blobPath)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllOrphans = async () => {
    if (!data || data.orphans.length === 0) return;
    const message = `Delete ${data.orphan_count} confidently orphaned blob${data.orphan_count === 1 ? "" : "s"}, ${formatBytes(data.orphan_size_bytes)}? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setBulkDeleting(true);
    setBulkResult(null);
    let succeeded = 0;
    let failed = 0;

    for (const blob of data.orphans) {
      try {
        const res = await fetch(
          `/api/proxy/admin/blobs?container=${encodeURIComponent(blob.container)}&blob_path=${encodeURIComponent(blob.blob_path)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          succeeded += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    setBulkResult(`Deleted ${succeeded} confidently orphaned blob${succeeded === 1 ? "" : "s"}. ${failed} failed.`);
    setBulkDeleting(false);
    load();
  };

  const handleLoadDiagnostics = async () => {
    const jobId = diagnosticJobId.trim();
    if (!jobId) return;
    setDiagnosticsLoading(true);
    setDiagnosticsError(null);
    setDiagnostics(null);
    try {
      const res = await fetch(
        `/api/proxy/admin/analysis-jobs/${encodeURIComponent(jobId)}/handoff-diagnostics`
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail ?? `Diagnostics failed: ${res.status}`);
      setDiagnostics(body as HandoffDiagnostics);
    } catch (err) {
      setDiagnosticsError(err instanceof Error ? err.message : "Diagnostics failed");
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading blobs…</p>
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

  if (!data) return null;

  if (!data.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <HardDrive className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Azure Blob Storage not configured in this environment.</p>
      </div>
    );
  }

  const displayBlobs = [...(showAll ? data.blobs : data.orphans)].sort((a, b) => {
    const aTime = a.last_modified ? new Date(a.last_modified).getTime() : 0;
    const bTime = b.last_modified ? new Date(b.last_modified).getTime() : 0;
    return bTime - aTime;
  });
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(displayBlobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedBlobs = pageSize === "all"
    ? displayBlobs
    : displayBlobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const renderStatus = (blob: BlobEntry) => {
    const status = blob.status ?? (blob.is_orphan ? "orphan" : "protected");
    const classes: Record<string, string> = {
      linked: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      "user-owned": "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      "public active": "border-sky-500/30 bg-sky-500/10 text-sky-400",
      "public expired": "border-amber-500/30 bg-amber-500/10 text-amber-400",
      unmatched: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
      orphan: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      protected: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${classes[status] ?? classes.protected}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blob Storage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Azure Blob — raw uploads &amp; results
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.orphan_count > 0 && (
            <button
              onClick={handleDeleteAllOrphans}
              disabled={bulkDeleting}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleting ? "Deleting..." : "Delete all orphans"}
            </button>
          )}
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {bulkResult && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {bulkResult}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-card-foreground">Protected handoff diagnostics</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin-only lookup for public AnalysisJob footprint matches. Raw health values are not shown.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <input
              value={diagnosticJobId}
              onChange={(event) => setDiagnosticJobId(event.target.value)}
              placeholder="Analysis job id"
              className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground sm:min-w-80"
            />
            <button
              onClick={handleLoadDiagnostics}
              disabled={diagnosticsLoading || !diagnosticJobId.trim()}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              {diagnosticsLoading ? "Checking..." : "Check handoff"}
            </button>
          </div>
        </div>
        {diagnosticsError && (
          <p className="mt-3 text-xs text-destructive">{diagnosticsError}</p>
        )}
        {diagnostics && (
          <div className="mt-4 grid gap-3 text-xs text-muted-foreground lg:grid-cols-4">
            <p><span className="text-card-foreground">Status:</span> {diagnostics.handoff_status}</p>
            <p><span className="text-card-foreground">Feature CSV:</span> {diagnostics.feature_csv_available ? "available" : "missing"}</p>
            <p><span className="text-card-foreground">Reason:</span> {diagnostics.reason_code}</p>
            <p><span className="text-card-foreground">Matched:</span> {diagnostics.matched_existing_protected_footprint ? "yes" : "no"}</p>
            <div className="lg:col-span-4">
              {diagnostics.matched_users.length === 0 ? (
                <p>No protected user match found.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Matched user</th>
                        <th className="px-3 py-2 text-left font-medium">User id</th>
                        <th className="px-3 py-2 text-left font-medium">Hash prefix</th>
                        <th className="px-3 py-2 text-left font-medium">Confidence</th>
                        <th className="px-3 py-2 text-left font-medium">Reason codes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnostics.matched_users.map((user) => (
                        <tr key={user.user_id} className="border-t border-border">
                          <td className="px-3 py-2">{user.email}</td>
                          <td className="px-3 py-2 font-mono">{user.user_id}</td>
                          <td className="px-3 py-2 font-mono">{user.footprint_hash_prefix ?? "—"}</td>
                          <td className="px-3 py-2">{user.confidence ?? "—"}</td>
                          <td className="px-3 py-2">{user.reason_codes.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total blobs</p>
          <p className="text-xl font-bold">{data.total_count}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatBytes(data.total_size_bytes)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Raw uploads</p>
          <p className="text-xl font-bold">{data.blobs.filter(b => b.container !== "results").length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Results</p>
          <p className="text-xl font-bold">{data.blobs.filter(b => b.container === "results").length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${data.orphan_count > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card"}`}>
          <p className="text-xs text-muted-foreground mb-1">Confident orphans</p>
          <p className={`text-xl font-bold ${data.orphan_count > 0 ? "text-amber-400" : ""}`}>{data.orphan_count}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatBytes(data.orphan_size_bytes)}</p>
        </div>
      </div>

      {/* Orphan warning */}
      {data.orphan_count > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-300">
            {data.orphan_count} blob{data.orphan_count !== 1 ? "s" : ""} have no matching reference found by the current scanner ({formatBytes(data.orphan_size_bytes)}).
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status legend</p>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p><span className="text-emerald-400">linked</span> exact DB reference found</p>
          <p><span className="text-indigo-300">user-owned</span> private artifact associated with a user</p>
          <p><span className="text-sky-400">public active</span> public artifact within 7-day controlled-launch TTL</p>
          <p><span className="text-amber-400">public expired</span> public artifact older than TTL and cleanup-eligible if unclaimed</p>
          <p><span className="text-zinc-300">unmatched</span> known runtime namespace without exact DB reference</p>
          <p><span className="text-amber-400">orphan</span> no reference and safe to delete</p>
          <p><span className="text-zinc-300">protected</span> delete disabled</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!showAll ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
        >
          Confident orphans ({data.orphan_count})
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${showAll ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
        >
          All blobs ({data.total_count})
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {pagedBlobs.length} of {displayBlobs.length} blob{displayBlobs.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(event) => setPageSize(event.target.value === "all" ? "all" : Number(event.target.value) as 20 | 50 | 100)}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
            aria-label="Page size"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground disabled:opacity-40"
          >
            Previous
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              className={`min-w-8 rounded border px-2 py-1 text-xs ${pageNumber === currentPage ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages}
            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      {displayBlobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {showAll ? "No blobs found." : "No confidently orphaned blobs found by the current scanner."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Blob path</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Container</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Size</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last modified</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagedBlobs.map((blob) => {
                const key = `${blob.container}/${blob.blob_path}`;
                const canDelete = blob.status === "orphan" || blob.status === "public expired" || blob.is_orphan;
                return (
                  <tr key={key} className={blob.is_orphan ? "bg-amber-500/5" : ""}>
                    <td className="max-w-md whitespace-normal break-all px-4 py-3 font-mono text-xs text-muted-foreground">
                      {blob.blob_path}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {blob.container}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatBytes(blob.size_bytes)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(blob.last_modified)}
                    </td>
                    <td className="px-4 py-3">
                      {renderStatus(blob)}
                    </td>
                    <td className="px-4 py-3">
                      {canDelete ? (
                        <button
                          onClick={() => handleDelete(blob.container, blob.blob_path)}
                          disabled={deleting === key}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                          title="Delete orphaned blob"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deleting === key ? "Deleting..." : "Delete"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
