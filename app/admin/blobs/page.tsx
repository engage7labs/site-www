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
  status?: "linked" | "orphan" | "unknown";
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
              {displayBlobs.map((blob) => {
                const key = `${blob.container}/${blob.blob_path}`;
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
                      {blob.status === "orphan" || blob.is_orphan ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                          orphan
                        </span>
                      ) : blob.status === "unknown" ? (
                        <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
                          unmatched
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          linked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {blob.status === "orphan" || blob.is_orphan ? (
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
