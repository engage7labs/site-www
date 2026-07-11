"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { useCallback, useEffect, useState } from "react";

type Methods = { password: boolean; google: boolean };

export function ConnectedSignInMethods() {
  const { t } = useLocale();
  const copy = t.portal.signInMethods;
  const [methods, setMethods] = useState<Methods | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() =>
    fetch("/api/auth/methods", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((value: Methods) => setMethods(value))
      .catch(() => setMethods(null)), []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPassword() {
    if (password.length < 8) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (response?.ok) {
      setPassword("");
      setMessage(copy.passwordConnected);
      await load();
    } else {
      setMessage(copy.reauthenticate);
    }
    setBusy(false);
  }

  async function connectGoogle() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/auth/link-google", { method: "POST" }).catch(
      () => null,
    );
    const data = (await response?.json().catch(() => ({}))) as { url?: string };
    if (response?.ok && data.url) {
      window.location.assign(data.url);
      return;
    }
    setMessage(copy.googleError);
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {copy.body}
      </p>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span>{copy.password}</span>
          <span className="text-xs text-muted-foreground">
            {methods?.password ? copy.connected : copy.notConnected}
          </span>
        </div>
        {methods?.password === false && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="connected-method-password" className="sr-only">
              {copy.newPassword}
            </label>
            <input
              id="connected-method-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.newPassword}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2"
            />
            <button
              type="button"
              disabled={busy || password.length < 8}
              onClick={() => void addPassword()}
              className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
            >
              {copy.addPassword}
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span>{copy.google}</span>
          {methods?.google ? (
            <span className="text-xs text-muted-foreground">{copy.connected}</span>
          ) : methods ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void connectGoogle()}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
            >
              {copy.connectGoogle}
            </button>
          ) : null}
        </div>
      </div>
      {message && (
        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
