/**
 * PostHogProvider — initialises PostHog on mount and fires site_visited.
 *
 * Wrap the app tree with this component.
 * No-ops gracefully when the NEXT_PUBLIC_POSTHOG_KEY env var is absent.
 */

"use client";

import { initPostHog, trackSiteVisited } from "@/lib/telemetry";
import { useEffect, useRef } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    initPostHog();
    trackSiteVisited();
  }, []);

  return <>{children}</>;
}
