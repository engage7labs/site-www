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
import { postLoginDestination } from "@/lib/post-login-routing";
import {
  shouldCreateUserForAuthIntent,
  type AuthIntent,
} from "@/lib/auth-intent";
import { rememberPendingPublicClaim } from "@/lib/public-analysis-claim";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
import { Apple, Mail } from "lucide-react";
import { useEffect, useState } from "react";

interface PasswordlessLoginFormFieldsProps {
  readonly redirectTo?: string;
  readonly claimJobId?: string | null;
  readonly enableSocialLogin?: boolean;
  readonly requireAdmin?: boolean;
  readonly onSuccess?: () => void;
  readonly initialMode?: AuthIntent;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function PasswordlessLoginFormFields({
  redirectTo = "/portal",
  claimJobId,
  enableSocialLogin = true,
  requireAdmin = false,
  onSuccess,
  initialMode = "login",
}: PasswordlessLoginFormFieldsProps) {
  const [mode, setMode] = useState<AuthIntent>(initialMode);
  const [method, setMethod] = useState<"otp" | "password">(
    requireAdmin ? "password" : "otp",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"apple" | "google" | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const copy = getDictionary(locale).auth.login;
  const isRegister = mode === "register";

  useEffect(() => {
    setLocale(detectLocale());
    const pendingEmail = window.sessionStorage.getItem("engage7.pendingSignupEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
      window.sessionStorage.removeItem("engage7.pendingSignupEmail");
    }
  }, []);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  function reset(nextMode: AuthIntent) {
    setMode(nextMode);
    setMethod(requireAdmin ? "password" : "otp");
    setCode("");
    setCodeSent(false);
    setError("");
    setMessage("");
  }

  async function finishSession(session: Session) {
    const response = await fetch("/api/auth/magic-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        type: "email",
        redirect_to: safeAuthRedirectPath(redirectTo),
        preferred_locale: locale,
      }),
    });
    if (!response.ok) throw new Error("session_failed");
    publishAuthSessionChanged("login");
    onSuccess?.();
    window.location.assign(postLoginDestination({ requireAdmin, redirectTo }));
  }

  async function sendCode() {
    if (!email.trim() || loading || resendSeconds > 0) return;
    setLoading(true);
    setError("");
    setMessage("");
    if (claimJobId) rememberPendingPublicClaim(claimJobId);
    try {
      const { error: otpError } = await createSupabaseBrowserClient().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: shouldCreateUserForAuthIntent(mode) },
      });
      if (otpError) throw otpError;
      setCodeSent(true);
      setResendSeconds(30);
      setMessage(copy.otpSent);
    } catch {
      setError(copy.otpError);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (code.trim().length !== 6 || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: verifyError } = await createSupabaseBrowserClient().auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "email",
      });
      if (verifyError || !data.session) throw verifyError ?? new Error("missing_session");
      await finishSession(data.session);
    } catch {
      setError(copy.otpError);
      setLoading(false);
    }
  }

  async function passwordSignIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, admin: requireAdmin }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; role?: string };
      if (!response.ok) {
        setError(data.error ?? copy.genericError);
        return;
      }
      if (requireAdmin && data.role !== "admin") {
        setError(copy.adminDenied);
        return;
      }
      publishAuthSessionChanged("login");
      onSuccess?.();
      window.location.assign(postLoginDestination({ requireAdmin, redirectTo }));
    } catch {
      setError(copy.tryAgain);
    } finally {
      setLoading(false);
    }
  }

  async function socialSignIn(provider: "apple" | "google") {
    setSocialLoading(provider);
    setError("");
    if (claimJobId) rememberPendingPublicClaim(claimJobId);
    try {
      const callback = new URL(
        buildAuthCallbackUrl(
          resolveAuthRedirectOrigin(window.location.origin),
          safeAuthRedirectPath(redirectTo),
        ),
      );
      callback.searchParams.set("locale", locale);
      if (claimJobId) callback.searchParams.set("claim_job_id", claimJobId);
      const { error: oauthError } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });
      if (oauthError) throw oauthError;
    } catch {
      setSocialLoading(null);
      setError(provider === "apple" ? copy.appleError : copy.googleError);
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-3">
      {enableSocialLogin && (
        <>
          <Button type="button" className="h-11 w-full bg-black text-white hover:bg-black/90" disabled={loading || socialLoading !== null} onClick={() => void socialSignIn("apple")}>
            <Apple className="h-4 w-4" />
            {socialLoading === "apple" ? copy.appleLoading : copy.apple}
          </Button>
          <Button type="button" variant="outline" className="h-11 w-full border-slate-300 bg-white font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:border-slate-400 focus-visible:ring-slate-400/40 active:bg-slate-100 disabled:bg-white disabled:text-slate-500 dark:border-slate-300 dark:bg-white dark:text-slate-950 dark:hover:border-slate-400 dark:hover:bg-slate-50 dark:active:bg-slate-100" disabled={loading || socialLoading !== null} onClick={() => void socialSignIn("google")}>
            <GoogleMark />
            {socialLoading === "google" ? copy.googleLoading : copy.google}
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /><span>{copy.divider}</span><span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">{message}</p>}

      {method === "otp" && !requireAdmin ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-email">{copy.email}</Label>
            <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" disabled={codeSent} />
          </div>
          {codeSent && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-code">{copy.verificationCode}</Label>
              <Input id="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            </div>
          )}
          <Button type="button" onClick={() => void (codeSent ? verifyCode() : sendCode())} disabled={loading || (codeSent ? code.length !== 6 : !email.trim())}>
            <Mail className="h-4 w-4" />
            {loading ? copy.signingIn : codeSent ? copy.verifyCode : copy.sendCode}
          </Button>
          {codeSent && (
            <button type="button" disabled={loading || resendSeconds > 0} onClick={() => void sendCode()} className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60">
              {resendSeconds > 0 ? `${copy.resendCode} (${resendSeconds}s)` : copy.resendCode}
            </button>
          )}
          <button type="button" onClick={() => setMethod("password")} className="text-xs text-muted-foreground underline-offset-4 hover:underline">{copy.usePassword}</button>
        </div>
      ) : (
        <form onSubmit={passwordSignIn} className="flex flex-col gap-4">
          <Label htmlFor="legacy-email">{copy.email}</Label>
          <Input id="legacy-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          <Label htmlFor="legacy-password">{copy.password}</Label>
          <Input id="legacy-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          <Button type="submit" disabled={loading}>{loading ? copy.signingIn : copy.signIn}</Button>
          {!requireAdmin && <button type="button" onClick={() => setMethod("otp")} className="text-xs text-muted-foreground underline-offset-4 hover:underline">{copy.useEmailCode}</button>}
          <a href="/auth/forgot-password" className="text-center text-xs text-muted-foreground hover:underline">{copy.forgotPassword}</a>
        </form>
      )}

      {!requireAdmin && (
        <div className="flex items-center justify-center gap-4 text-xs">
          <button type="button" onClick={() => reset("login")} className={mode === "login" ? "text-foreground" : "text-muted-foreground"}>{copy.signIn}</button>
          <button type="button" onClick={() => reset("register")} className={mode === "register" ? "text-foreground" : "text-muted-foreground"}>{copy.createAccount}</button>
        </div>
      )}
    </div>
  );
}
