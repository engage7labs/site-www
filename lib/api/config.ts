/**
 * API Client Configuration
 *
 * Base configuration for Engage7 API client.
 * Sensitive endpoints route through the Next.js server-side proxy so the
 * browser never calls the API directly for protected operations.
 * Non-sensitive endpoints (health, metrics) still use the public API URL.
 */

import { config } from "@/lib/config";

/**
 * Public API base URL — used only for non-sensitive, read-only endpoints.
 */
export const API_BASE_URL = config.apiBaseUrl;

/**
 * API endpoints.
 * Sensitive operations go through /api/proxy/* (server-side, signed).
 * Public read-only endpoints use the API base URL directly.
 */
export const API_ENDPOINTS = {
  // Sensitive — proxied through Next.js server
  uploadAnalysis: "/api/proxy/analyze-upload",
  getAnalysisResult: (jobId: string) => `/api/proxy/result/${jobId}`,
  getPortalAnalysisResult: (jobId: string) =>
    `/api/proxy/users/portal-analyses/${jobId}`,
  getPdf: (jobId: string) => `/api/proxy/result/${jobId}/pdf`,
  getCsv: (jobId: string) => `/api/proxy/result/${jobId}/csv`,

  // Public — direct to API
  getMetrics: "/api/metrics",

  // Health
  getHealth: "/health",
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
