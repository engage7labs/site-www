/**
 * Analysis API
 *
 * Client functions for Engage7 analysis operations.
 * Wired to the live engage7-api backend (Sprint 9.2).
 */

import type { AnalysisResult, UploadResponse } from "@/lib/types/analysis";
import { ApiClientError, get } from "./client";
import { API_ENDPOINTS } from "./config";

/**
 * Submits an Apple Health ZIP export for analysis.
 *
 * Uses a two-step direct-upload strategy to bypass the Vercel 4.5 MB
 * serverless function body size limit:
 *   1. Fetch pre-signed HMAC headers from /api/proxy/upload-token (tiny req).
 *   2. POST the FormData directly to the API backend using those headers.
 *
 * The HMAC secret never leaves the Next.js server. The browser only receives
 * the computed signature which expires within 5 minutes.
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
  const formData = new FormData();
  formData.append("file", file);
  formData.append("consent", String(consent));
  formData.append("locale", locale);
  if (turnstileToken) formData.append("cf_turnstile_response", turnstileToken);

  console.info("[upload-debug] formdata_created", {
    fileName: file.name,
    fileSize: file.size,
    consent,
    locale,
    hasTurnstileToken: Boolean(turnstileToken),
  });

  // Step 1 — obtain pre-signed upload headers from the Next.js server.
  // This is a tiny JSON request (no file body) — safe within Vercel limits.
  const tokenRes = await fetch("/api/proxy/upload-token", { method: "POST" });
  if (!tokenRes.ok) {
    throw new ApiClientError(tokenRes.status, "Failed to obtain upload token");
  }
  const { uploadUrl, headers: sigHeaders } = (await tokenRes.json()) as {
    uploadUrl: string;
    headers: Record<string, string>;
  };

  console.info("[upload-debug] upload_token_obtained", {
    uploadUrl,
    hasSigHeaders: Boolean(sigHeaders && Object.keys(sigHeaders).length),
  });

  // Step 2 — POST FormData directly to the API (bypasses Vercel body limit).
  const controller = new AbortController();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: sigHeaders, // HMAC + key-id + timestamp — no Content-Type (browser sets boundary)
    body: formData,
    signal: controller.signal,
  });

  console.info("[upload-debug] direct_upload_returned", {
    uploadUrl,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    let errorData: { message?: string; error?: string; detail?: unknown };
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Upload failed with status ${response.status}` };
    }
    let message: string;
    if (typeof errorData.message === "string") {
      message = errorData.message;
    } else if (typeof errorData.error === "string") {
      message = errorData.error;
    } else if (typeof errorData.detail === "string") {
      message = errorData.detail;
    } else {
      message = `HTTP ${response.status}`;
    }
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
