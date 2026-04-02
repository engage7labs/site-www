"use client";

import { Crown, Database, Mail, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminUser {
  id: number;
  email: string;
  plan: string;
  trial_end_at: string | null;
  created_at: string | null;
  analyses_count: number;
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    trial: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    premium: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    expired: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[plan] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {plan}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key") ?? "";
    fetch(`/api/proxy/admin/users?admin_key=${encodeURIComponent(key)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<AdminUsersResponse>;
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-muted-foreground text-xs">
          Append ?key=YOUR_ADMIN_KEY to the URL to authenticate.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.total} registered user{data.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Total: {data.total}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            Trial: {data.users.filter((u) => u.plan === "trial").length}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Email
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trial Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <Database className="h-3 w-3" />
                  Analyses
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <PlanBadge plan={user.plan} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(user.trial_end_at)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                  {user.analyses_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
