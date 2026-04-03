"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function PasswordSetupAlert() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/proxy/users/portal-overview")
      .then((r) => r.json())
      .then((d) => setHasPassword(d.has_password ?? true))
      .catch(() => setHasPassword(true));
  }, []);

  if (hasPassword === null || hasPassword || dismissed || status === "success") return null;

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
        setStatus("success");
        setOpen(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to set password");
        setStatus("error");
      }
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }
  }

  return (
    <>
      <div className="mx-4 mt-3 sm:mx-6 rounded-lg border border-amber-300/50 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-3 text-sm">
        <KeyRound className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="text-amber-800 dark:text-amber-200 flex-1">
          You haven&apos;t set a password yet.{" "}
          <button
            onClick={() => setOpen(true)}
            className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
          >
            Set one now
          </button>{" "}
          to secure your account.
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600/60 dark:text-amber-400/60 hover:text-amber-800 dark:hover:text-amber-200 transition-colors text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set your password</DialogTitle>
            <DialogDescription>
              Create a password so you can sign in securely from any device.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password (min 8 characters)"
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {confirm && password !== confirm && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={!valid || status === "loading"}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              Set Password
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
