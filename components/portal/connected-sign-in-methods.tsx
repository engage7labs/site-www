"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { useCallback, useEffect, useState } from "react";

type Methods = { email: boolean; google: boolean; apple: boolean; password: boolean };
type LinkProvider = "apple" | "google";

export function ConnectedSignInMethods() {
  const { t } = useLocale();
  const copy = t.portal.signInMethods;
  const [methods, setMethods] = useState<Methods | null>(null);
  const [busy, setBusy] = useState<LinkProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() =>
    fetch("/api/auth/methods", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((value: Methods) => setMethods(value))
      .catch(() => setMethods(null)), []);

  useEffect(() => { void load(); }, [load]);

  async function connect(provider: LinkProvider) {
    setBusy(provider);
    setMessage(null);
    const response = await fetch(`/api/auth/link-${provider}`, { method: "POST" }).catch(
      () => null,
    );
    const data = (await response?.json().catch(() => ({}))) as { url?: string };
    if (response?.ok && data.url) {
      window.location.assign(data.url);
      return;
    }
    setMessage(provider === "apple" ? copy.appleError : copy.googleError);
    setBusy(null);
  }

  const rows: Array<{ provider: "email" | LinkProvider; label: string }> = [
    { provider: "email", label: copy.email },
    { provider: "apple", label: copy.apple },
    { provider: "google", label: copy.google },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">{copy.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
      <div className="mt-4 space-y-3 text-sm">
        {rows.map(({ provider, label }) => {
          const connected = methods?.[provider] === true;
          return (
            <div key={provider} className="flex items-center justify-between gap-4">
              <span>{label}</span>
              {connected ? (
                <span className="text-xs text-muted-foreground">{copy.connected}</span>
              ) : methods && provider !== "email" ? (
                <button type="button" disabled={busy !== null} onClick={() => void connect(provider)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-60">
                  {provider === "apple" ? copy.connectApple : copy.connectGoogle}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">{copy.notConnected}</span>
              )}
            </div>
          );
        })}
      </div>
      {methods?.password && <p className="mt-3 text-xs text-muted-foreground">{copy.legacyPassword}</p>}
      {message && <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">{message}</p>}
    </div>
  );
}
