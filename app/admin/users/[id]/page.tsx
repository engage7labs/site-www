"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminUserDetail {
  id: number;
  email: string;
  role: string;
  plan: string;
  trial_start_at: string | null;
  trial_end_at: string | null;
  consent_given_at: string | null;
  consent_version: string | null;
  created_at: string | null;
  last_login_at: string | null;
  analyses: Array<{
    job_id: string;
    created_at: string | null;
    report_label: string | null;
    dataset_hash: string | null;
  }>;
  feedback: Array<{
    id: number;
    job_id: string | null;
    feedback_type: string;
    note: string | null;
    created_at: string | null;
  }>;
  recent_events: Array<{
    id: number;
    event_type: string;
    job_id: string | null;
    created_at: string | null;
  }>;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Section({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/proxy/admin/users/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<AdminUserDetail>;
      })
      .then(setUser)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading user…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-destructive text-sm">{error ?? "User not found"}</p>
        <a href="/admin/users" className="text-xs text-accent hover:underline">
          ← Back to users
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role} · {user.plan}
          </p>
        </div>
        <a href="/admin/users" className="text-xs text-accent hover:underline">
          ← All users
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Created", value: fmt(user.created_at) },
          { label: "Last login", value: fmt(user.last_login_at) },
          { label: "Consent given", value: fmt(user.consent_given_at) },
          { label: "Consent version", value: user.consent_version ?? "—" },
          { label: "Trial start", value: fmt(user.trial_start_at) },
          { label: "Trial end", value: fmt(user.trial_end_at) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-card-foreground mt-0.5">
              {value}
            </p>
          </div>
        ))}
      </div>

      <Section title={`Analyses (${user.analyses.length})`}>
        {user.analyses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No analyses yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {user.analyses.map((a) => (
              <div
                key={a.job_id}
                className="py-2 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-card-foreground">
                    {a.report_label ?? "Health Analysis"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {a.job_id}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmt(a.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Feedback (${user.feedback.length})`}>
        {user.feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {user.feedback.map((f) => (
              <div
                key={f.id}
                className="py-2 flex items-center justify-between"
              >
                <span className="text-sm text-card-foreground">
                  {f.feedback_type}
                  {f.note ? ` — "${f.note}"` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmt(f.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Recent events (${user.recent_events.length})`}>
        {user.recent_events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {user.recent_events.map((e) => (
              <div
                key={e.id}
                className="py-2 flex items-center justify-between"
              >
                <span className="text-sm text-card-foreground">
                  {e.event_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmt(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
