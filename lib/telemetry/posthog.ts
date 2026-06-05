/**
 * PostHog Telemetry Client
 *
 * Initialises PostHog for product analytics / investor-grade telemetry.
 * Behaviour and journey tracking only; no sensitive health data, session replay,
 * or heatmaps.
 */

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://eu.posthog.com";

let initialised = false;

/**
 * Initialise PostHog (call once on app mount).
 * Session replay stays disabled for controlled launch.
 * No-ops silently when the key is absent (local dev).
 */
export function initPostHog(): void {
  if (initialised || typeof window === "undefined" || !POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_UI_HOST,
    capture_pageview: false, // we fire our own page events
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false, // keep events deliberate
    disable_session_recording: true,
  });

  initialised = true;
}

/**
 * Capture a named event with optional properties.
 * No-ops when PostHog is not initialised.
 */
export function capture(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!initialised) return;
  posthog.capture(event, properties);
}

/**
 * Identify a user (optional — not required for anonymous analytics).
 */
export function identify(
  distinctId: string,
  traits?: Record<string, unknown>
): void {
  if (!initialised) return;
  posthog.identify(distinctId, traits);
}

/**
 * Reset identity (e.g. on logout).
 */
export function reset(): void {
  if (!initialised) return;
  posthog.reset();
}

/**
 * Capture a $pageview event for SPA route changes.
 * Call on each pathname change after initial mount.
 */
export function capturePageview(url?: string): void {
  if (!initialised) return;
  posthog.capture("$pageview", url ? { $current_url: url } : undefined);
}
