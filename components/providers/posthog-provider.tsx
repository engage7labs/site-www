/**
 * PostHogProvider — initialises PostHog on mount, fires site_visited, and
 * captures $pageview on every SPA route change (Next.js App Router).
 *
 * Wrap the app tree with this component.
 * No-ops gracefully when the NEXT_PUBLIC_POSTHOG_KEY env var is absent.
 */

"use client";

import {
  capturePageview,
  initPostHog,
  trackSiteVisited,
} from "@/lib/telemetry";
import {
  getCookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialised = useRef(false);
  const pathname = usePathname();

  const initialiseTelemetry = () => {
    if (initialised.current || getCookieConsent() !== "accepted") return;
    initialised.current = true;
    initPostHog();
    trackSiteVisited();
    capturePageview(window.location.href);
  };

  // Initialise only after optional analytics consent.
  useEffect(() => {
    initialiseTelemetry();
    return subscribeCookieConsent((consent) => {
      if (consent === "accepted") initialiseTelemetry();
    });
  }, []);

  // Capture $pageview on every subsequent route change
  useEffect(() => {
    if (!initialised.current) return;
    capturePageview(window.location.href);
  }, [pathname]);

  return <>{children}</>;
}
