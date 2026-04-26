/**
 * PasswordSetupAlert — Sprint 30.2
 *
 * Calm activation prompt. Language: "access code" not "password".
 * Shown when the user hasn't set a password yet (plan=trial_start or missing password).
 * Fires account_activated telemetry on success.
 */
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackAccountActivated } from "@/lib/telemetry/events";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "engage7_access_code_dismissed";

export function PasswordSetupAlert() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true);
      return;
    }
    fetch("/api/proxy/users/portal-overview")
      .then((r) => r.json())
      .then((d) => setHasPassword(d.has_password ?? true))
      .catch(() => setHasPassword(true));
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  if (hasPassword === null || hasPassword || dismissed || status === "success")
    return null;

  const valid = password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setHasPassword(true);
        setStatus("success");
        setOpen(false);
        trackAccountActivated();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ?? "Something went wrong — please try again"
        );
        setStatus("error");
      }
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }
  }

  return (
    <>
      {/* Calm activation banner — Sprint 30.2 */}
      <div className="mx-4 mt-3 sm:mx-6 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex items-center gap-3 text-sm">
        <KeyRound className="h-4 w-4 shrink-0 text-accent" />
        <span className="text-foreground/80 flex-1">
          Secure your access —{" "}
          <button
            onClick={() => setOpen(true)}
            className="font-medium text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
          >
            create an access code
          </button>{" "}
          to return from any device.
        </span>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create your access code</DialogTitle>
            <DialogDescription>
              Choose a personal code to return to your dashboard from any device.
              At least 8 characters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Access code (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <input
              type="password"
              placeholder="Confirm access code"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {confirm && password !== confirm && (
              <p className="text-xs text-destructive">Codes do not match</p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={!valid || status === "loading"}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save access code
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
