/**
 * Analysis API
 *
 * Client functions for Engage7 analysis operations.
 * Wired to the live engage7-api backend (Sprint 9.2).
 */

import { get, postFormData } from "./client";
import { API_ENDPOINTS, API_BASE_URL } from "./config";
import type { UploadResponse, AnalysisResult } from "@/lib/types/analysis";

/**
 * Submits an Apple Health ZIP export for analysis.
 *
 * POST /api/analyze-upload
 * Returns immediately with a job_id and status "queued".
 */
export async function submitAnalysisUpload(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return postFormData<UploadResponse>(API_ENDPOINTS.uploadAnalysis, formData);
}

/**
 * Gets the current status and result for an analysis job.
 *
 * GET /api/result/{jobId}
 * Polling endpoint — status may be queued, processing, completed, or failed.
 */
export async function getAnalysisResult(
  jobId: string
): Promise<AnalysisResult> {
  return get<AnalysisResult>(API_ENDPOINTS.getAnalysisResult(jobId));
}

/**
 * Returns the full URL for downloading the PDF report.
 * The caller is responsible for verifying artifacts.pdf_available before use.
 */
export function getPdfUrl(jobId: string): string {
  return API_BASE_URL + API_ENDPOINTS.getPdf(jobId);
}
