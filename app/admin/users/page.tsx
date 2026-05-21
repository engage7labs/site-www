"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  plan_display: string;
  plan_status: string | null;
  consent_status: string;
  role_display: string;
  consent_given_at: string | null;
  created_at: string | null;
  last_login_at: string | null;
  analyses_count: number;
  events_count: number;
  health_footprint: {
    present: boolean;
    protection_enabled: boolean;
    updated_at: string | null;
    hash_prefix: string | null;
  };
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

function PlanBadge({ label, status }: Readonly<{ label: string; status?: string | null }>) {
  const colors: Record<string, string> = {
    trialing: "bg-blue-500/10 text-blue-400",
    active: "bg-emerald-500/10 text-emerald-400",
    expired: "bg-red-500/10 text-red-400",
    none: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status ?? "none"] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function FootprintBadge({ footprint }: Readonly<{ footprint: AdminUser["health_footprint"] }>) {
  const label = footprint.present
    ? footprint.protection_enabled ? "Protected" : "Present, off"
    : "Missing";
  const classes = footprint.present
    ? footprint.protection_enabled
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-amber-500/10 text-amber-400"
    : "bg-muted text-muted-foreground";
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
        {label}
      </span>
      {footprint.hash_prefix && (
        <span className="font-mono text-[11px] text-muted-foreground">{footprint.hash_prefix}</span>
      )}
    </div>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingAsUserId, setViewingAsUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/proxy/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<AdminUsersResponse>;
      })
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, []);

  const handleViewAsUser = async (userId: string) => {
    setViewingAsUserId(userId);
    try {
      const response = await fetch(`/admin/view-as/${userId}`, {
        method: "POST",
        redirect: "manual",
      });
      if (response.ok) {
        // Route returns JSON { ok: true } with session cookie set.
        // Navigate to portal via GET (not redirect) to avoid POST /portal → 405.
        window.location.href = "/portal";
      } else {
        const body = (await response
          .json()
          .catch(() => ({ detail: "Unknown error" }))) as { detail?: string };
        setError(body.detail ?? `Failed to view as user (${response.status})`);
        setViewingAsUserId(null);
      }
    } catch (err) {
      setViewingAsUserId(null);
      console.error("[admin view-as client]", err);
      setError("Network error while switching to user view");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading users…</p>
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total ?? 0} registered user{data?.total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Email",
                "Role",
                "Plan",
                "Consent",
                "Created",
                "Last login",
                "Footprint",
                "Analyses",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.users ?? []).map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.role_display}</td>
                <td className="px-4 py-3">
                  <PlanBadge label={user.plan_display} status={user.plan_status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {user.consent_given_at
                    ? `Accepted on ${fmt(user.consent_given_at)}`
                    : "Not accepted"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmt(user.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmt(user.last_login_at)}
                </td>
                <td className="px-4 py-3">
                  <FootprintBadge footprint={user.health_footprint} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {user.analyses_count}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-accent hover:underline"
                    >
                      Detail
                    </a>
                    <button
                      onClick={() => handleViewAsUser(user.id)}
                      disabled={viewingAsUserId === user.id}
                      className="text-xs px-2 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 transition-colors"
                    >
                      {viewingAsUserId === user.id
                        ? "Switching…"
                        : "View as User"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
