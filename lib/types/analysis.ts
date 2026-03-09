/**
 * Analysis Types
 *
 * TypeScript types for Engage7 analysis API.
 * Aligned with the actual engage7-api backend contract.
 */

// Status values as returned by the backend
export type AnalysisStatus = "queued" | "processing" | "completed" | "failed";

// -------------------------------------------------------------------------
// Backend response shapes (snake_case — as returned by engage7-api)
// -------------------------------------------------------------------------

/** Returned by POST /api/analyze-upload */
export interface UploadResponse {
  job_id: string;
  status: AnalysisStatus;
  result_url: string;
  pdf_url: string;
}

/** Dataset summary in GET /api/result/{job_id} */
export interface DatasetSummary {
  dataset_start: string | null;
  dataset_end: string | null;
  days: number | null;
  total_rows: number | null;
}

/** Artifact info in GET /api/result/{job_id} */
export interface AnalysisArtifacts {
  pdf_available: boolean;
  pdf_url: string | null;
  pdf_blob_url: string | null;
}

/** Full result returned by GET /api/result/{job_id} */
export interface AnalysisResult {
  job_id: string;
  status: AnalysisStatus;
  summary: DatasetSummary | null;
  highlights: string[];
  sections: Record<string, unknown> | null;
  artifacts: AnalysisArtifacts | null;
  error: string | null;
}

// -------------------------------------------------------------------------
// Error type
// -------------------------------------------------------------------------

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}
