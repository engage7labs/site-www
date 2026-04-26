/**
 * Analysis API
 *
 * Client functions for Engage7 analysis operations.
 * Wired to the live engage7-api backend (Sprint 9.2).
 */

import type { AnalysisResult, UploadResponse } from "@/lib/types/analysis";
import { ApiClientError, get } from "./client";
import { API_ENDPOINTS } from "./config";

/** Extract a human-readable error message from an API error response. */
function extractErrorMessage(
  response: Response,
  errorData: Record<string, unknown>
): string {
  if (typeof errorData.message === "string") return errorData.message;
  if (typeof errorData.error === "string") return errorData.error;
  if (typeof errorData.detail === "string") return errorData.detail;
  return `HTTP ${response.status}`;
}

/**
 * Submits an Apple Health ZIP export for analysis.
 *
 * Uses a three-step direct-to-blob strategy:
 *   1. POST consent/locale to /api/proxy/upload-token → gets SAS URL + job_id.
 *   2. PUT the file directly to Azure Blob Storage via SAS URL (bypasses ACA proxy).
 *   3. POST to API /confirm-upload → creates job and triggers ACA executor.
 *
 * Falls back to the legacy direct-to-API POST if SAS is unavailable.
 *
 * @param file          Apple Health ZIP export file.
 * @param consent       User consent flag — must be true to proceed.
 * @param locale        User locale string (e.g. "en-IE").
 * @param turnstileToken Cloudflare Turnstile challenge token.
 */
export async function submitAnalysisUpload(
  file: File,
  consent: boolean,
  locale: string,
  turnstileToken?: string
): Promise<UploadResponse> {
  console.info("[upload-debug] formdata_created", {
    fileName: file.name,
    fileSize: file.size,
    consent,
    locale,
    hasTurnstileToken: Boolean(turnstileToken),
  });

  // Step 1 — obtain SAS URL + job_id from the Next.js server.
  const tokenForm = new FormData();
  tokenForm.append("consent", String(consent));
  tokenForm.append("locale", locale);
  if (turnstileToken) tokenForm.append("cf_turnstile_response", turnstileToken);

  const tokenRes = await fetch("/api/proxy/upload-token", {
    method: "POST",
    body: tokenForm,
  });
  if (!tokenRes.ok) {
    throw new ApiClientError(tokenRes.status, "Failed to obtain upload token");
  }

  const tokenData = (await tokenRes.json()) as {
    mode?: string;
    job_id?: string;
    sas_url?: string;
    confirmUrl?: string;
    confirmHeaders?: Record<string, string>;
    // Legacy fallback
    uploadUrl: string;
    headers: Record<string, string>;
  };

  // Direct-to-blob path (preferred)
  if (
    tokenData.mode === "direct-blob" &&
    tokenData.sas_url &&
    tokenData.confirmUrl
  ) {
    console.info("[upload-debug] direct_blob_mode job_id=%s", tokenData.job_id);

    // Step 2 — PUT file directly to Azure Blob Storage via SAS URL.
    const blobRes = await fetch(tokenData.sas_url, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": "application/zip",
      },
      body: file,
    });

    if (!blobRes.ok) {
      const errText = await blobRes.text().catch(() => "");
      console.error("[upload-debug] blob_put_failed", blobRes.status, errText);
      throw new ApiClientError(blobRes.status, "File upload to storage failed");
    }

    console.info("[upload-debug] blob_put_ok job_id=%s", tokenData.job_id);

    // Step 3 — Confirm upload with the API to create job + dispatch ACA.
    const confirmForm = new FormData();
    confirmForm.append("job_id", tokenData.job_id!);
    confirmForm.append("locale", locale);

    const confirmRes = await fetch(tokenData.confirmUrl, {
      method: "POST",
      headers: tokenData.confirmHeaders ?? {},
      body: confirmForm,
    });

    if (!confirmRes.ok) {
      const errData = await confirmRes
        .json()
        .catch(() => ({ detail: "Confirm failed" }));
      throw new ApiClientError(
        confirmRes.status,
        typeof errData.detail === "string"
          ? errData.detail
          : `HTTP ${confirmRes.status}`
      );
    }

    console.info("[upload-debug] confirm_ok job_id=%s", tokenData.job_id);
    return confirmRes.json() as Promise<UploadResponse>;
  }

  // Legacy fallback — POST file directly to API
  console.info("[upload-debug] legacy_mode uploadUrl=%s", tokenData.uploadUrl);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("consent", String(consent));
  formData.append("locale", locale);
  if (turnstileToken) formData.append("cf_turnstile_response", turnstileToken);

  const response = await fetch(tokenData.uploadUrl, {
    method: "POST",
    headers: tokenData.headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Upload failed with status ${response.status}`,
    }));
    const message = extractErrorMessage(response, errorData);
    throw new ApiClientError(response.status, message, errorData.detail);
  }

  return response.json() as Promise<UploadResponse>;
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
 * Routes through the server-side proxy (same origin).
 * The caller is responsible for verifying artifacts.pdf_available before use.
 */
export function getPdfUrl(jobId: string): string {
  return API_ENDPOINTS.getPdf(jobId);
}

/**
 * Returns the full URL for downloading the canonical CSV dataset.
 * Routes through the server-side proxy (same origin).
 * The caller is responsible for verifying artifacts.csv_available before use.
 */
export function getCsvUrl(jobId: string): string {
  return API_ENDPOINTS.getCsv(jobId);
}

/**
 * Fetches aggregate anonymous metrics for social proof display.
 *
 * GET /api/metrics
 */
export interface PublicMetrics {
  total_uploads: number;
  uploads_24h: number;
  unique_locales: number;
}

export interface APIHealth {
  status: string;
  timestamp: string;
  version: string;
  git_sha?: string;
  environment?: string;
  build_time?: string;
}

export async function getPublicMetrics(): Promise<PublicMetrics> {
  return get<PublicMetrics>(API_ENDPOINTS.getMetrics);
}

export async function getApiHealth(): Promise<APIHealth> {
  return get<APIHealth>(API_ENDPOINTS.getHealth, {
    timeout: 5000,
    skipRetry: true,
  });
}
