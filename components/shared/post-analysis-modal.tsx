"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Crown, Loader2, LogIn, Mail, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface PostAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  onFeedback: (value: string, note?: string) => void;
  onEmailSubmit: (email: string, consent: boolean) => Promise<void>;
  onGoogleSubmit?: () => Promise<void>;
  onShare: () => Promise<void>;
  pdfAvailable?: boolean;
  mode?: "premium" | "protected-handoff";
  onProtectedHandoff?: () => Promise<void>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PostAnalysisModal({
  open,
  onClose,
  onEmailSubmit,
  onGoogleSubmit,
  onProtectedHandoff,
  mode = "premium",
}: Readonly<PostAnalysisModalProps>) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const isValidEmail = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const canSubmit = isValidEmail && consentChecked && !submitting && !redirecting;

  if (!open) return null;
  const isProtectedHandoff = mode === "protected-handoff";

  const handleUnlockPremium = async () => {
    const normalized = email.trim();
    if (!normalized) {
      setEmailError(t.result.premiumModal.emailRequired);
      return;
    }
    if (!EMAIL_RE.test(normalized)) {
      setEmailError(t.result.premiumModal.emailInvalid);
      return;
    }
    if (!consentChecked) {
      return;
    }
    setEmailError(null);
    setSubmitError(null);
    setSubmitting(true);

    try {
      await onEmailSubmit(normalized, true);
      toast.success(t.result.premiumModal.success);
      setRedirecting(true);
      redirectTimerRef.current = setTimeout(() => {
        window.location.href = "/portal";
      }, 3000);
    } catch {
      setSubmitError(t.result.premiumModal.genericError);
      setSubmitting(false);
    }
  };

  const handleProtectedHandoff = async () => {
    if (!onProtectedHandoff || submitting || redirecting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onProtectedHandoff();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : t.result.protectedHandoffModal.genericError
      );
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (!onGoogleSubmit || !consentChecked || submitting || redirecting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onGoogleSubmit();
    } catch {
      setSubmitError(t.result.premiumModal.genericError);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label={t.common.close}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {isProtectedHandoff
                ? t.result.protectedHandoffModal.title
                : t.result.premiumModal.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isProtectedHandoff
                ? t.result.protectedHandoffModal.body
                : t.result.premiumModal.description}
            </p>
          </div>

          {/* Consent is explicit and required before either onboarding choice. */}
          {!isProtectedHandoff && <div className="flex items-start gap-3">
            <input
              id="consent-checkbox"
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-[#e6b800] cursor-pointer"
            />
            <label
              htmlFor="consent-checkbox"
              className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
            >
              {t.result.premiumModal.consent}
            </label>
          </div>}

          {!isProtectedHandoff && onGoogleSubmit && <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!consentChecked || submitting || redirecting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {t.result.premiumModal.google}
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>{t.result.premiumModal.divider}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>}

          {/* Email input — remains a supported onboarding path. */}
          {!isProtectedHandoff && <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="premium-email"
            >
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t.result.premiumModal.emailLabel}
              </span>
            </label>
            <input
              id="premium-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
            />
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>}

          {/* Error from backend */}
          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}

          {/* CTA — Unlock Premium */}
          <div className="flex justify-center border-t border-border pt-4">
            <button
              type="button"
              onClick={
                isProtectedHandoff
                  ? handleProtectedHandoff
                  : handleUnlockPremium
              }
              disabled={
                isProtectedHandoff
                  ? submitting || redirecting
                  : !canSubmit
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#175cff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#175cff]/25 ring-1 ring-[#8fb0ff]/50 transition-colors duration-200 hover:bg-[#0f49d8] active:bg-[#0b38a8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isProtectedHandoff ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              {isProtectedHandoff
                ? t.result.protectedHandoffModal.button
                : redirecting
                ? t.result.premiumModal.opening
                : t.result.premiumModal.open}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
