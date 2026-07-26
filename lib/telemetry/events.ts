/**
 * Canonical Engage7 web telemetry.
 *
 * PostHog is web/client only. Events are product-funnel signals, not job
 * observability and never carry physiological values, filenames, raw errors,
 * emails, blob paths, dates of health data, or section payloads.
 */

import { capture } from "./posthog";
import { getUserContext } from "./user-context";

export const POSTHOG_EVENTS = [
  "site_visited",
  "public_get_started_clicked",
  "signup_or_login_started",
  "authentication_completed",
  "onboarding_started",
  "onboarding_completed",
  "trial_unlock_started",
  "portal_opened",
  "report_viewed",
  "health_dashboard_viewed",
  "update_data_started",
  "update_data_completed",
  "update_data_failed",
  "feedback_submitted",
  "subscription_started",
] as const;

export type PostHogEventName = (typeof POSTHOG_EVENTS)[number];

type SafeTelemetryProperties = Partial<{
  surface: string;
  action: string;
  status: string;
  step: string;
  plan_display: string;
  plan_tier: string;
  plan_status: string;
  has_feature_timeline: boolean;
  has_darth: boolean;
  has_report: boolean;
  source: "public" | "portal" | "admin";
  error_code: string;
  user_kind: "admin" | "user" | "anonymous";
  is_internal_test: true;
}>;

const SAFE_KEYS = new Set([
  "surface",
  "action",
  "status",
  "step",
  "plan_display",
  "plan_tier",
  "plan_status",
  "has_feature_timeline",
  "has_darth",
  "has_report",
  "source",
  "error_code",
  "user_kind",
  "is_internal_test",
]);

function safeProperties(
  properties: SafeTelemetryProperties = {}
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && SAFE_KEYS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

export function trackEvent(
  event: PostHogEventName,
  properties?: SafeTelemetryProperties
): void {
  capture(event, { ...getUserContext(), ...safeProperties(properties) });
}

export function trackSiteVisited(): void {
  trackEvent("site_visited", { source: "public" });
}

export function trackPublicGetStartedClicked(): void {
  trackEvent("public_get_started_clicked", { source: "public", surface: "landing" });
}

export function trackSignupOrLoginStarted(): void {
  trackEvent("signup_or_login_started", { source: "public", surface: "authentication" });
}

export function trackAuthenticationCompleted(): void {
  trackEvent("authentication_completed", { source: "portal", surface: "authentication" });
}

export function trackOnboardingStarted(): void {
  trackEvent("onboarding_started", { source: "portal", surface: "onboarding" });
}

export function trackOnboardingCompleted(): void {
  trackEvent("onboarding_completed", { source: "portal", surface: "onboarding" });
}

export function trackTrialUnlockStarted(surface = "teaser"): void {
  trackEvent("trial_unlock_started", { source: "portal", surface });
}

export function trackPortalOpened(): void {
  trackEvent("portal_opened", { source: "portal", surface: "portal" });
}

export function trackReportViewed(_jobId?: string): void {
  void _jobId;
  trackEvent("report_viewed", {
    source: "portal",
    surface: "report",
  });
}

export function trackHealthDashboardViewed(action: string): void {
  trackEvent("health_dashboard_viewed", {
    source: "portal",
    surface: "health",
    action,
  });
}

export function trackUpdateDataStarted(): void {
  trackEvent("update_data_started", {
    source: "portal",
    surface: "data_update",
  });
}

export function trackUpdateDataCompleted(_jobId?: string): void {
  void _jobId;
  trackEvent("update_data_completed", {
    source: "portal",
    surface: "data_update",
    status: "completed",
  });
}

export function trackUpdateDataFailed(errorCode = "upload_failed"): void {
  trackEvent("update_data_failed", {
    source: "portal",
    surface: "data_update",
    status: "failed",
    error_code: errorCode,
  });
}

export function trackFeedbackSubmitted(properties: {
  surface: string;
  target_type: string;
  sentiment: "yes" | "no";
  source?: "public" | "portal" | "admin";
}): void {
  trackEvent("feedback_submitted", {
    source: properties.source ?? "portal",
    surface: properties.surface,
    action: properties.target_type,
    status: properties.sentiment,
  });
}

export function trackSubscriptionStarted(): void {
  trackEvent("subscription_started", {
    source: "portal",
    surface: "settings",
    plan_display: "Premium",
    plan_tier: "premium",
    plan_status: "active",
  });
}

// Backward-compatible helper names for active authenticated plan events.
export const trackPremiumCtaClicked = trackTrialUnlockStarted;
export const trackPlanUpgraded = trackSubscriptionStarted;
