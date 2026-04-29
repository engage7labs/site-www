"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function logSetup(event: string, fields: Record<string, unknown> = {}): void {
  // Never log tokens, JWTs, or full URLs.
  console.log(JSON.stringify({ event, ...fields }));
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const isWelcome = searchParams.get("mode") === "welcome";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  const valid = password.length >= 8 && password === confirm;

  useEffect(() => {
    if (isWelcome && status === "success") {
      const timer = setTimeout(() => router.push("/portal"), 800);
      return () => clearTimeout(timer);
    }
  }, [isWelcome, status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !token) return;

    setStatus("loading");
    setError("");
    if (isWelcome) logSetup("welcome_access_code_setup_started");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus("success");
        if (isWelcome) logSetup("welcome_access_code_setup_succeeded");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to reset password");
        setStatus("error");
        if (isWelcome) logSetup("welcome_access_code_setup_failed");
      }
    } catch {
      setError("Network error — please try again");
      setStatus("error");
      if (isWelcome) logSetup("welcome_access_code_setup_failed");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">
            Invalid Link
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <a
            href="/login"
            className="inline-block text-sm text-accent hover:underline"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {isWelcome ? "Access code created" : "Password updated"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isWelcome
              ? "Taking you to your Engage7 portal..."
              : "Your password has been set. You can now sign in."}
          </p>
          {isWelcome ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <a
              href="/login"
              className="inline-block rounded-md bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            {isWelcome ? "Create your access code" : "Set your password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isWelcome
              ? "Choose an access code so you can return to your Engage7 portal anytime."
              : "Choose a strong password for your Engage7 account."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={
                isWelcome
                  ? "Access code (min 8 characters)"
                  : "New password (min 8 characters)"
              }
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
            placeholder={isWelcome ? "Confirm access code" : "Confirm password"}
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
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!valid || status === "loading"}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {isWelcome ? "Create access code" : "Set Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
