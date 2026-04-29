/**
 * CookieConsentBanner — Sprint 30.2
 *
 * GDPR-compliant cookie consent for EU visitors.
 * Calm, non-intrusive design matching the Engage7 dark aesthetic.
 * Only visible on public pages (not portal/admin — those users consented during onboarding).
 *
 * Storage: localStorage "engage7_cookie_consent" = "accepted" | "essential"
 * PostHog session recording is only enabled when "accepted".
 */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CONSENT_KEY = "engage7_cookie_consent";

export type CookieConsent = "accepted" | "essential" | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "accepted" || v === "essential") return v;
  return null;
}

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Don't show inside portal or admin (users already consented via onboarding)
  const isProtected =
    pathname.startsWith("/portal") || pathname.startsWith("/admin");

  useEffect(() => {
    if (isProtected) return;
    const existing = localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      setVisible(true);
    }
  }, [isProtected]);

  if (!visible || isProtected) return null;

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    // PostHog session recording will activate on next page view
    // (PostHogProvider reads consent on init — reload needed for replay)
  };

  const handleEssential = () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm px-5 py-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground">
            Your data stays yours.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            We use essential cookies to keep you signed in. With your consent, we
            also enable anonymous session analytics to improve the product. No health
            data is ever shared.{" "}
            <a
              href="/privacy-policy"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEssential}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
