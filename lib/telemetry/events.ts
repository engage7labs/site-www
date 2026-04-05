/**
 * Telemetry Events — Sprint 11
 *
 * Named event helpers for the insight-preview journey.
 * Each function enriches the event with user context automatically.
 * NO sensitive physiological data is ever sent.
 */

import { capture } from "./posthog";
import { getUserContext } from "./user-context";

// ---- Acquisition / arrival ------------------------------------------------

export function trackSiteVisited(): void {
  capture("site_visited", getUserContext());
}

export function trackResultPageViewed(jobId?: string): void {
  capture("result_page_viewed", {
    ...getUserContext(),
    job_id: jobId,
  });
}

// ---- Analysis journey -----------------------------------------------------

interface PreviewMeta {
  jobId?: string;
  datasetDurationUnit?: string;
  datasetDurationValue?: number;
  previewStage?: string;
}

export function trackAnalysisPreviewLoaded(meta: PreviewMeta): void {
  capture("analysis_preview_loaded", {
    ...getUserContext(),
    job_id: meta.jobId,
    dataset_duration_unit: meta.datasetDurationUnit,
    dataset_duration_value: meta.datasetDurationValue,
    preview_stage: meta.previewStage,
  });
}

export function trackSleepPreviewViewed(meta: PreviewMeta): void {
  capture("sleep_preview_viewed", {
    job_id: meta.jobId,
    dataset_duration_unit: meta.datasetDurationUnit,
    dataset_duration_value: meta.datasetDurationValue,
    preview_stage: "sleep",
  });
}

export function trackRecoveryPreviewViewed(meta: PreviewMeta): void {
  capture("recovery_preview_viewed", {
    job_id: meta.jobId,
    dataset_duration_unit: meta.datasetDurationUnit,
    dataset_duration_value: meta.datasetDurationValue,
    preview_stage: "recovery",
  });
}

export function trackActivityPreviewViewed(meta: PreviewMeta): void {
  capture("activity_preview_viewed", {
    job_id: meta.jobId,
    dataset_duration_unit: meta.datasetDurationUnit,
    dataset_duration_value: meta.datasetDurationValue,
    preview_stage: "activity",
  });
}

// ---- Interaction journey --------------------------------------------------

export function trackPreviewNextClicked(
  insightType: string,
  previewStage: string
): void {
  capture("preview_next_clicked", {
    insight_type: insightType,
    preview_stage: previewStage,
  });
}

export function trackInsightCardExpanded(
  insightType: string,
  previewStage: string
): void {
  capture("insight_card_expanded", {
    insight_type: insightType,
    preview_stage: previewStage,
  });
}

export function trackChartInteracted(
  insightType: string,
  previewStage: string
): void {
  capture("chart_interacted", {
    insight_type: insightType,
    preview_stage: previewStage,
  });
}

export function trackFullReportCtaViewed(ctaLocation: string): void {
  capture("full_report_cta_viewed", {
    cta_location: ctaLocation,
  });
}

export function trackReportUnlockClicked(ctaLocation: string): void {
  capture("report_unlock_clicked", {
    cta_location: ctaLocation,
  });
}

// ---- Upload lifecycle -----------------------------------------------------

export function trackUploadStarted(fileSize?: number, fileName?: string): void {
  capture("upload_started", {
    ...getUserContext(),
    file_size: fileSize,
    file_name: fileName,
  });
}

export function trackUploadCompleted(jobId: string): void {
  capture("upload_completed", {
    ...getUserContext(),
    job_id: jobId,
  });
}

export function trackDatasetUploadStarted(): void {
  capture("dataset_upload_started", getUserContext());
}

export function trackDatasetUploadCompleted(): void {
  capture("dataset_upload_completed", getUserContext());
}

export function trackAnalysisStarted(jobId: string): void {
  capture("analysis_started", { job_id: jobId, ...getUserContext() });
}

export function trackAnalysisCompleted(jobId: string): void {
  capture("analysis_completed", { job_id: jobId, ...getUserContext() });
}

// ---- PDF & Downloads ------------------------------------------------------

export function trackPdfDownloadClicked(
  jobId: string,
  ctaLocation?: string
): void {
  capture("pdf_download_clicked", {
    ...getUserContext(),
    job_id: jobId,
    cta_location: ctaLocation,
  });
}

// ---- Error tracking -------------------------------------------------------

export function trackErrorOccurred(
  errorType: string,
  errorMessage?: string,
  context?: Record<string, unknown>
): void {
  capture("error_occurred", {
    ...getUserContext(),
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  });
}

// ---- Sprint 20 Phase 5 — Disciplined PostHog events -----------------------

export function trackDailyBriefingViewed(jobId?: string): void {
  capture("daily_briefing_viewed", {
    ...getUserContext(),
    job_id: jobId,
  });
}

export function trackPremiumUnlocked(jobId?: string): void {
  capture("premium_unlocked", {
    ...getUserContext(),
    job_id: jobId,
  });
}

export function trackInsightViewed(
  insightType: string,
  jobId?: string
): void {
  capture("insight_viewed", {
    ...getUserContext(),
    insight_type: insightType,
    job_id: jobId,
  });
}
