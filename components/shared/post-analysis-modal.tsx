"use client";

import { Crown, Loader2, Mail, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface PostAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  onFeedback: (value: string, note?: string) => void;
  onEmailSubmit: (email: string, consent: boolean) => Promise<void>;
  onShare: () => Promise<void>;
  pdfAvailable?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PostAnalysisModal({
  open,
  onClose,
  onEmailSubmit,
}: Readonly<PostAnalysisModalProps>) {
  const [email, setEmail] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isValidEmail = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const canSubmit = isValidEmail && consentChecked && !submitting;

  if (!open) return null;

  const handleUnlockPremium = async () => {
    const normalized = email.trim();
    if (!normalized) {
      setEmailError("Email is required to unlock premium.");
      return;
    }
    if (!EMAIL_RE.test(normalized)) {
      setEmailError("Please enter a valid email address.");
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
      toast.success("Your 90-day premium trial has started");
      window.location.href = "/portal";
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
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
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Unlock your premium experience
            </h2>
            <p className="text-sm text-muted-foreground">
              Get 90 days of free premium access — advanced trends, correlations, and a personal health portal.
            </p>
          </div>

          {/* Email input — required */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="premium-email"
            >
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Your email
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
          </div>

          {/* Consent checkbox — required before unlock */}
          <div className="flex items-start gap-3">
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
              I agree to store my processed health insights so Engage7 can
              show me trends and portal insights. I can delete this data at
              any time from portal settings.
            </label>
          </div>

          {/* Error from backend */}
          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}

          {/* CTA — Unlock Premium */}
          <div className="flex justify-center border-t border-border pt-4">
            <button
              type="button"
              onClick={handleUnlockPremium}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e6b800] px-5 py-2.5 text-sm font-medium text-[#1a1a1a] shadow-sm transition-colors duration-200 hover:bg-[#f2c94c] active:bg-[#c99a00] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#1a1a1a]"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              Unlock Premium (90 days free)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
