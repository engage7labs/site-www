"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildAuthCallbackUrl,
  resolveAuthRedirectOrigin,
  safeAuthRedirectPath,
} from "@/lib/auth-redirects";
import { publishAuthSessionChanged } from "@/lib/auth-session-client";
import { detectLocale, getDictionary, type Locale } from "@/lib/i18n";
import { rememberPendingPublicClaim } from "@/lib/public-analysis-claim";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LoginFormFieldsProps {
  /** Where to redirect on successful login (default: /portal) */
  readonly redirectTo?: string;
  readonly claimJobId?: string | null;
  readonly enableSocialLogin?: boolean;
  readonly requireAdmin?: boolean;
  /** Called when login succeeds — allows parent to close a modal */
  readonly onSuccess?: () => void;
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function LoginFormFields({
  redirectTo = "/portal",
  claimJobId,
  enableSocialLogin = true,
  requireAdmin = false,
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");

  const isRegister = mode === "register";
  const shouldRevealPassword = !enableSocialLogin || email.trim().length > 0;
  const copy = getDictionary(locale).auth.login;

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

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
      setError(copy.passwordMismatch);
      return;
    }

    setLoading(true);
    if (claimJobId) rememberPendingPublicClaim(claimJobId);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const bodyPayload = isRegister
        ? { email, password, confirmPassword }
        : { email, password, admin: requireAdmin };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? copy.genericError);
        return;
      }

      if (isRegister) {
        // After successful registration, switch to login with a success hint
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccessMessage(copy.accountCreated);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { role?: string };
      const role = data.role === "admin" ? "admin" : "user";
      if (requireAdmin && role !== "admin") {
        setError("This account is not authorised for the Admin Portal.");
        return;
      }

      publishAuthSessionChanged("login");
      onSuccess?.();
      router.push(role === "admin" ? "/admin" : redirectTo);
      router.refresh();
    } catch {
      setError(copy.tryAgain);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMessage("");
    setGoogleLoading(true);
    if (claimJobId) rememberPendingPublicClaim(claimJobId);

    try {
      const nextPath = safeAuthRedirectPath(redirectTo);
      const redirectOrigin = resolveAuthRedirectOrigin(window.location.origin);
      const redirectUrl = buildAuthCallbackUrl(redirectOrigin, nextPath);
      if (claimJobId) {
        const callback = new URL(redirectUrl);
        callback.searchParams.set("claim_job_id", claimJobId);
        callback.searchParams.set("locale", locale);
        const supabase = createSupabaseBrowserClient();
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: callback.toString(),
          },
        });
        if (oauthError) throw oauthError;
        return;
      }

      const callback = new URL(redirectUrl);
      callback.searchParams.set("locale", locale);
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
        },
      });
      if (oauthError) throw oauthError;
    } catch {
      setGoogleLoading(false);
      setError(copy.googleError);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-3">
      {enableSocialLogin && (
        <>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-border bg-white text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 focus-visible:ring-lime-400/60 disabled:bg-white disabled:text-slate-500 disabled:opacity-70 dark:border-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-50"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
          >
            {!googleLoading && <GoogleMark />}
            {googleLoading ? copy.googleLoading : copy.google}
          </Button>
          <div
            className="flex w-full items-center gap-3 text-xs text-muted-foreground"
            aria-controls="email-login-panel"
          >
            <span className="h-px flex-1 bg-border" />
            <span>{copy.divider}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
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

      <form
        id="email-login-panel"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-email">{copy.email}</Label>
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

        {shouldRevealPassword && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-password">{copy.password}</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            {!isRegister && (
              <a
                href="/auth/forgot-password"
                className="self-end text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
              >
                {copy.forgotPassword}
              </a>
            )}
          </div>
        )}

        {isRegister && shouldRevealPassword && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-confirm-password">
              {copy.confirmPassword}
            </Label>
            <Input
              id="auth-confirm-password"
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        )}

        {shouldRevealPassword && (
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isRegister
                ? copy.creatingAccount
                : copy.signingIn
              : isRegister
                ? copy.createAccount
                : copy.signIn}
          </Button>
        )}

        <div className="flex items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50 ${
              !isRegister
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {copy.signIn}
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50 ${
              isRegister
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {copy.createAccount}
          </button>
          <a
            href="/auth/forgot-password"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
          >
            {copy.recoverAccess}
          </a>
        </div>
      </form>
    </div>
  );
}
