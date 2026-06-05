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
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialised = useRef(false);
  const pathname = usePathname();

  // Initialise once on first mount and fire site_visited
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    initPostHog();
    trackSiteVisited();
    // Capture initial pageview
    capturePageview(window.location.href);
  }, []);

  // Capture $pageview on every subsequent route change
  useEffect(() => {
    if (!initialised.current) return;
    capturePageview(window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}
