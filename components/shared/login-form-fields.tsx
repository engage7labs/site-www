"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  claimPendingPublicAnalysis,
  rememberPendingPublicClaim,
} from "@/lib/public-analysis-claim";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginFormFieldsProps {
  /** Where to redirect on successful login (default: /portal) */
  readonly redirectTo?: string;
  readonly claimJobId?: string | null;
  /** Called when login succeeds — allows parent to close a modal */
  readonly onSuccess?: () => void;
}

export function LoginFormFields({
  redirectTo = "/portal",
  claimJobId,
  onSuccess,
}: LoginFormFieldsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    if (claimJobId) rememberPendingPublicClaim(claimJobId);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const bodyPayload = isRegister
        ? { email, password, confirmPassword }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Something went wrong");
        return;
      }

      if (isRegister) {
        // After successful registration, switch to login with a success hint
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccessMessage("Account created — you can now sign in.");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { role?: string };
      const role = data.role === "admin" ? "admin" : "user";

      if (role !== "admin") {
        try {
          await claimPendingPublicAnalysis();
        } catch {
          // Keep the pending claim in session storage; Portal will offer retry.
        }
      }

      onSuccess?.();
      router.push(role === "admin" ? "/admin" : redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            !isRegister
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            isRegister
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create account
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {successMessage}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
        {!isRegister && (
          <a
            href="/auth/forgot-password"
            className="self-end text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </a>
        )}
      </div>

      {isRegister && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-confirm-password">Confirm password</Label>
          <Input
            id="auth-confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? isRegister
            ? "Creating account…"
            : "Signing in…"
          : isRegister
          ? "Create account"
          : "Sign in"}
      </Button>
    </form>
  );
}
