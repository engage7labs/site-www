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
  "public_upload_started",
  "public_upload_completed",
  "analysis_completed",
  "teaser_viewed",
  "trial_unlock_started",
  "trial_unlock_completed",
  "portal_opened",
  "claim_import_started",
  "claim_import_completed",
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
  job_id: string;
  short_job_id: string;
  error_code: string;
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
  "job_id",
  "short_job_id",
  "error_code",
]);

function safeProperties(
  properties: SafeTelemetryProperties = {},
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
  properties?: SafeTelemetryProperties,
): void {
  capture(event, { ...getUserContext(), ...safeProperties(properties) });
}

export function trackSiteVisited(): void {
  trackEvent("site_visited", { source: "public" });
}

export function trackPublicUploadStarted(): void {
  trackEvent("public_upload_started", { source: "public", surface: "analyze" });
}

export function trackPublicUploadCompleted(jobId?: string): void {
  trackEvent("public_upload_completed", {
    source: "public",
    surface: "analyze",
    job_id: jobId,
  });
}

export function trackAnalysisCompleted(jobId?: string): void {
  trackEvent("analysis_completed", { source: "public", job_id: jobId });
}

export function trackTeaserViewed(jobId?: string): void {
  trackEvent("teaser_viewed", { source: "public", surface: "teaser", job_id: jobId });
}

export function trackTrialUnlockStarted(surface = "teaser"): void {
  trackEvent("trial_unlock_started", { source: "public", surface });
}

export function trackTrialUnlockCompleted(jobId?: string): void {
  trackEvent("trial_unlock_completed", {
    source: "public",
    surface: "teaser",
    job_id: jobId,
    plan_display: "Premium Free",
    plan_tier: "premium",
    plan_status: "trialing",
  });
}

export function trackPortalOpened(): void {
  trackEvent("portal_opened", { source: "portal", surface: "portal" });
}

export function trackClaimImportStarted(jobId?: string): void {
  trackEvent("claim_import_started", { source: "portal", job_id: jobId });
}

export function trackClaimImportCompleted(
  jobId?: string,
  status = "completed",
): void {
  trackEvent("claim_import_completed", { source: "portal", job_id: jobId, status });
}

export function trackReportViewed(jobId?: string): void {
  trackEvent("report_viewed", { source: "portal", surface: "report", job_id: jobId });
}

export function trackHealthDashboardViewed(surface: string): void {
  trackEvent("health_dashboard_viewed", { source: "portal", surface });
}

export function trackUpdateDataStarted(): void {
  trackEvent("update_data_started", { source: "portal", surface: "data_update" });
}

export function trackUpdateDataCompleted(jobId?: string): void {
  trackEvent("update_data_completed", {
    source: "portal",
    surface: "data_update",
    job_id: jobId,
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

// Backward-compatible helper names for existing imports.
export const trackUploadStarted = trackPublicUploadStarted;
export const trackUploadCompleted = trackPublicUploadCompleted;
export const trackPremiumCtaClicked = trackTrialUnlockStarted;
export const trackTrialStarted = trackTrialUnlockCompleted;
export const trackPlanUpgraded = trackSubscriptionStarted;
