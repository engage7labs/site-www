/**
 * Analysis Types
 *
 * TypeScript types for Engage7 analysis API.
 */

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface AnalysisJobAccepted {
  jobId: string;
  status: "pending";
  createdAt: string;
}

export interface AnalysisSummary {
  datasetPeriod: string;
  recordsAnalyzed: number;
  insightsGenerated: number;
  processingTimeMs?: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AnalysisArtifact {
  type: "pdf" | "csv" | "json";
  name: string;
  url: string;
  sizeBytes: number;
}

export interface AnalysisResult {
  jobId: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt?: string;
  summary?: AnalysisSummary;
  insights?: Insight[];
  artifacts?: AnalysisArtifact[];
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface AnalysisStatusResponse {
  jobId: string;
  status: AnalysisStatus;
  progress?: number;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}
