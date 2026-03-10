/**
 * API Client Configuration
 *
 * Base configuration for Engage7 API client.
 * API base URL is sourced from the centralized config module.
 */

import { config } from "@/lib/config";

/**
 * API base URL — reads from NEXT_PUBLIC_API_BASE_URL via centralized config.
 */
export const API_BASE_URL = config.apiBaseUrl;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Analysis endpoints
  uploadAnalysis: "/api/analyze-upload",
  getAnalysisResult: (jobId: string) => `/api/result/${jobId}`,
  getPdf: (jobId: string) => `/api/result/${jobId}/pdf`,
  getCsv: (jobId: string) => `/api/result/${jobId}/csv`,

  // Metrics
  getMetrics: "/api/metrics",
} as const;

/**
 * API request timeout (ms)
 */
export const API_TIMEOUT = 30000;

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
} as const;
