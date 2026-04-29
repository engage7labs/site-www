export type PortalDataLayerStatus =
  | "no_user"
  | "no_analysis"
  | "analysis_processing"
  | "analysis_failed"
  | "analysis_available"
  | "feature_timeline_available"
  | "feature_timeline_missing"
  | "feature_timeline_unavailable"
  | "darth_available"
  | "darth_missing"
  | "legacy_scientific_available"
  | "legacy_scientific_missing";

export type PortalPrimaryDataSource =
  | "user_feature_store"
  | "user_analysis_sections"
  | "legacy_sections"
  | "analysis_job"
  | "none";

export type PortalFeatureTimelineStatus =
  | "available"
  | "missing"
  | "blob_unavailable"
  | "blob_missing"
  | "parse_failed"
  | "empty"
  | "unknown";

export interface PortalDataStatus {
  hasUser: boolean;
  hasAnalyses: boolean;
  hasLatestSections: boolean;
  hasDarth: boolean;
  hasFeatureTimeline: boolean;
  hasLegacyScientificData: boolean;
  analysisStatus: PortalDataLayerStatus;
  featureTimelineStatus: PortalFeatureTimelineStatus;
  darthStatus: PortalDataLayerStatus;
  legacyScientificStatus: PortalDataLayerStatus;
  primaryDataSource: PortalPrimaryDataSource;
  latestAnalysisId?: string;
  latestJobId?: string;
}

export const EMPTY_PORTAL_DATA_STATUS: PortalDataStatus = {
  hasUser: false,
  hasAnalyses: false,
  hasLatestSections: false,
  hasDarth: false,
  hasFeatureTimeline: false,
  hasLegacyScientificData: false,
  analysisStatus: "no_user",
  featureTimelineStatus: "unknown",
  darthStatus: "darth_missing",
  legacyScientificStatus: "legacy_scientific_missing",
  primaryDataSource: "none",
};

type StatusInput = {
  hasUser?: boolean;
  analysisCount?: number;
  latestSections?: unknown;
  latestAnalysisId?: string;
  latestJobId?: string;
  uploadStatus?: string | null;
  featureStore?: unknown;
  dataPoints?: unknown[];
  dataStatus?: string | null;
  trends?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasObjectValue(record: Record<string, unknown>, key: string): boolean {
  return isRecord(record[key]) || Array.isArray(record[key]);
}

export function normaliseFeatureTimelineStatus(
  dataStatus: string | null | undefined,
  hasFeatureStore: boolean,
  hasDataPoints: boolean,
): PortalFeatureTimelineStatus {
  if (hasDataPoints) return "available";
  if (!hasFeatureStore) return "missing";
  if (dataStatus === "blob_storage_unavailable") return "blob_unavailable";
  if (dataStatus === "feature_store_blob_missing") return "blob_missing";
  if (dataStatus === "feature_store_parse_failed") return "parse_failed";
  if (dataStatus === "empty_feature_store") return "empty";
  return "unknown";
}

export function derivePortalDataStatus(input: StatusInput): PortalDataStatus {
  const hasUser = input.hasUser ?? true;
  const analysisCount = input.analysisCount ?? 0;
  const hasAnalyses = analysisCount > 0;
  const latestSections = isRecord(input.latestSections) ? input.latestSections : null;
  const hasLatestSections = latestSections !== null;
  const hasDarth = isRecord(latestSections?.darth);
  const hasFeatureStore = input.featureStore != null;
  const hasDataPoints = (input.dataPoints?.length ?? 0) > 0;
  const featureTimelineStatus = normaliseFeatureTimelineStatus(
    input.dataStatus,
    hasFeatureStore,
    hasDataPoints,
  );
  const hasFeatureTimeline = featureTimelineStatus === "available";
  const trends = isRecord(input.trends) ? input.trends : {};
  const hasLegacyScientificData =
    hasObjectValue(trends, "baseline") ||
    hasObjectValue(trends, "correlations") ||
    hasObjectValue(trends, "volatility") ||
    Array.isArray(latestSections?.yearly_summary);

  const analysisStatus: PortalDataLayerStatus = !hasUser
    ? "no_user"
    : !hasAnalyses
      ? "no_analysis"
      : input.uploadStatus === "queued" || input.uploadStatus === "processing"
        ? "analysis_processing"
        : input.uploadStatus === "failed"
          ? "analysis_failed"
          : "analysis_available";

  const primaryDataSource: PortalPrimaryDataSource = hasFeatureTimeline
    ? "user_feature_store"
    : hasLatestSections
      ? "user_analysis_sections"
      : hasLegacyScientificData
        ? "legacy_sections"
        : "none";

  return {
    hasUser,
    hasAnalyses,
    hasLatestSections,
    hasDarth,
    hasFeatureTimeline,
    hasLegacyScientificData,
    analysisStatus,
    featureTimelineStatus,
    darthStatus: hasDarth ? "darth_available" : "darth_missing",
    legacyScientificStatus: hasLegacyScientificData
      ? "legacy_scientific_available"
      : "legacy_scientific_missing",
    primaryDataSource,
    latestAnalysisId: input.latestAnalysisId,
    latestJobId: input.latestJobId,
  };
}
