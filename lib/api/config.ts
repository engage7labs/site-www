/**
 * API Client Configuration
 *
 * Base configuration for Engage7 API client.
 */

/**
 * API base URL
 *
 * In production, this should point to the engage7-api service.
 * For now, it's configured for local development or future deployment.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Analysis endpoints
  uploadAnalysis: "/api/analyze-upload",
  getAnalysisResult: (jobId: string) => `/api/result/${jobId}`,
  getPdf: (jobId: string) => `/api/result/${jobId}/pdf`,
  getCsv: (jobId: string) => `/api/result/${jobId}/csv`,
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
