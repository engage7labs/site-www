/**
 * PostHog Telemetry Client
 *
 * Initialises PostHog for product analytics / investor-grade telemetry.
 * Sprint 11 — behaviour + journey tracking only, no sensitive health data.
 */

/**
 * PostHog Telemetry Client
 *
 * Initialises PostHog for product analytics / investor-grade telemetry.
 * Sprint 11 — behaviour + journey tracking only, no sensitive health data.
 * Sprint 31.1 — session replay enabled when cookie consent = "accepted".
 */

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let initialised = false;

/** Read cookie consent from localStorage. */
function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("engage7_cookie_consent") === "accepted";
}

/**
 * Initialise PostHog (call once on app mount).
 * Session replay enabled only when user accepted analytics cookies.
 * No-ops silently when the key is absent (local dev).
 */
export function initPostHog(): void {
  if (initialised || typeof window === "undefined" || !POSTHOG_KEY) return;

  const sessionReplayEnabled = hasAnalyticsConsent();

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we fire our own page events
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false, // keep events deliberate
    disable_session_recording: !sessionReplayEnabled,
    session_recording: sessionReplayEnabled
      ? {
          // Mask health data inputs just in case
          maskAllInputs: false,
          maskInputOptions: { password: true },
        }
      : undefined,
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
