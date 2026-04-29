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
  latestUploadStatus?: string | null;
}

export type PortalDataStatusWire = Partial<{
  has_user: boolean;
  has_analyses: boolean;
  has_latest_sections: boolean;
  has_darth: boolean;
  has_feature_timeline: boolean;
  has_legacy_scientific_data: boolean;
  analysis_status: PortalDataLayerStatus;
  feature_timeline_status: PortalFeatureTimelineStatus;
  darth_status: PortalDataLayerStatus;
  legacy_scientific_status: PortalDataLayerStatus;
  primary_data_source: PortalPrimaryDataSource;
  latest_analysis_id: string;
  latest_job_id: string;
  latest_upload_status: string | null;
}>;

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

function boolValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

const DATA_LAYER_STATUSES: readonly PortalDataLayerStatus[] = [
  "no_user",
  "no_analysis",
  "analysis_processing",
  "analysis_failed",
  "analysis_available",
  "feature_timeline_available",
  "feature_timeline_missing",
  "feature_timeline_unavailable",
  "darth_available",
  "darth_missing",
  "legacy_scientific_available",
  "legacy_scientific_missing",
];

const FEATURE_TIMELINE_STATUSES: readonly PortalFeatureTimelineStatus[] = [
  "available",
  "missing",
  "blob_unavailable",
  "blob_missing",
  "parse_failed",
  "empty",
  "unknown",
];

const PRIMARY_DATA_SOURCES: readonly PortalPrimaryDataSource[] = [
  "user_feature_store",
  "user_analysis_sections",
  "legacy_sections",
  "analysis_job",
  "none",
];

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

export function parsePortalDataStatus(value: unknown): PortalDataStatus | null {
  if (!isRecord(value)) return null;

  return {
    hasUser: boolValue(value.has_user ?? value.hasUser, false),
    hasAnalyses: boolValue(value.has_analyses ?? value.hasAnalyses, false),
    hasLatestSections: boolValue(
      value.has_latest_sections ?? value.hasLatestSections,
      false,
    ),
    hasDarth: boolValue(value.has_darth ?? value.hasDarth, false),
    hasFeatureTimeline: boolValue(
      value.has_feature_timeline ?? value.hasFeatureTimeline,
      false,
    ),
    hasLegacyScientificData: boolValue(
      value.has_legacy_scientific_data ?? value.hasLegacyScientificData,
      false,
    ),
    analysisStatus: stringValue(
      value.analysis_status ?? value.analysisStatus,
      DATA_LAYER_STATUSES,
      "no_analysis",
    ),
    featureTimelineStatus: stringValue(
      value.feature_timeline_status ?? value.featureTimelineStatus,
      FEATURE_TIMELINE_STATUSES,
      "unknown",
    ),
    darthStatus: stringValue(
      value.darth_status ?? value.darthStatus,
      DATA_LAYER_STATUSES,
      "darth_missing",
    ),
    legacyScientificStatus: stringValue(
      value.legacy_scientific_status ?? value.legacyScientificStatus,
      DATA_LAYER_STATUSES,
      "legacy_scientific_missing",
    ),
    primaryDataSource: stringValue(
      value.primary_data_source ?? value.primaryDataSource,
      PRIMARY_DATA_SOURCES,
      "none",
    ),
    latestAnalysisId:
      typeof (value.latest_analysis_id ?? value.latestAnalysisId) === "string"
        ? ((value.latest_analysis_id ?? value.latestAnalysisId) as string)
        : undefined,
    latestJobId:
      typeof (value.latest_job_id ?? value.latestJobId) === "string"
        ? ((value.latest_job_id ?? value.latestJobId) as string)
        : undefined,
    latestUploadStatus:
      typeof (value.latest_upload_status ?? value.latestUploadStatus) === "string"
        ? ((value.latest_upload_status ?? value.latestUploadStatus) as string)
        : null,
  };
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
