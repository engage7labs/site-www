/**
 * Telemetry Events — Sprint 28.1
 *
 * YODA §14: Only events with a clear GTM hypothesis are tracked.
 * Rule: If removing an event doesn't affect a funnel decision, remove it.
 *
 * Active funnel (8 events):
 *   upload_started → upload_completed → analysis_completed → teaser_viewed
 *   → premium_cta_clicked → trial_started → portal_opened → trial_reconfirmed
 *
 * NO sensitive physiological data is ever sent.
 */

import { capture } from "./posthog";
import { getUserContext } from "./user-context";

// ── Funnel step 1 ──────────────────────────────────────────────────────────
// Hypothesis: drop-off between started and completed reveals UX friction.

export function trackUploadStarted(fileSize?: number): void {
  capture("upload_started", { ...getUserContext(), file_size: fileSize });
}

// ── Funnel step 2 ──────────────────────────────────────────────────────────
// Hypothesis: completion rate confirms upload reliability.

export function trackUploadCompleted(jobId: string): void {
  capture("upload_completed", { ...getUserContext(), job_id: jobId });
}

// ── Funnel step 3 ──────────────────────────────────────────────────────────
// Hypothesis: analysis_completed → teaser_viewed drop-off signals slow load or UX confusion.

export function trackAnalysisCompleted(jobId: string): void {
  capture("analysis_completed", { ...getUserContext(), job_id: jobId });
}

// ── Funnel step 4 ──────────────────────────────────────────────────────────
// Hypothesis: if teaser_viewed > 80%, the result page is landing correctly.

export function trackTeaserViewed(jobId?: string): void {
  capture("teaser_viewed", { ...getUserContext(), job_id: jobId });
}

// ── Funnel step 5 ──────────────────────────────────────────────────────────
// Hypothesis: premium_cta_clicked / teaser_viewed > 30% validates conversion intent.

export function trackPremiumCtaClicked(ctaLocation: string): void {
  capture("premium_cta_clicked", { ...getUserContext(), cta_location: ctaLocation });
}

// ── Funnel step 6 ──────────────────────────────────────────────────────────
// Hypothesis: trial_started is the primary conversion metric for free → paid.

export function trackTrialStarted(jobId?: string): void {
  capture("trial_started", { ...getUserContext(), job_id: jobId });
}

// ── Funnel step 7 ──────────────────────────────────────────────────────────
// Hypothesis: portal_opened measures activation — user accessed depth layer after trial start.

export function trackPortalOpened(): void {
  capture("portal_opened", getUserContext());
}

// ── Funnel step 8 ──────────────────────────────────────────────────────────
// Hypothesis: trial_reconfirmed measures retention intent after first portal session.

export function trackTrialReconfirmed(): void {
  capture("trial_reconfirmed", getUserContext());
}

// ── Funnel step 9 ──────────────────────────────────────────────────────────
// Hypothesis: account_activated measures how many users complete onboarding
// (access code set). Sprint 30.2 / 31.1.

export function trackAccountActivated(): void {
  capture("account_activated", getUserContext());
}

// ── Funnel step 10 ─────────────────────────────────────────────────────────
// Hypothesis: plan_upgraded is the primary monetisation conversion event.
// Sprint 33.0.

export function trackPlanUpgraded(): void {
  capture("plan_upgraded", getUserContext());
}
