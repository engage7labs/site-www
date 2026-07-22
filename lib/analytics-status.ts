export const ACTIVE_ANALYTICS_CONTRACT = "user_feature_store.v2" as const;

export type AnalyticsDataState =
  | "CURRENT_V2"
  | "LEGACY_V1_REUPLOAD_REQUIRED"
  | "NO_ANALYTICAL_DATA";

export interface AnalyticsStatusResponse {
  active_contract: typeof ACTIVE_ANALYTICS_CONTRACT;
  data_state: AnalyticsDataState;
  requires_reupload: boolean;
  reason_code:
    | "CURRENT_CONTRACT_DATA_AVAILABLE"
    | "LEGACY_CONTRACT_DATA_ONLY"
    | "NO_ANALYTICAL_DATA";
}

export function isAnalyticsReuploadRequired(
  value: unknown,
): value is AnalyticsStatusResponse {
  if (!value || typeof value !== "object") return false;
  const status = value as Partial<AnalyticsStatusResponse>;
  return (
    status.active_contract === ACTIVE_ANALYTICS_CONTRACT &&
    status.data_state === "LEGACY_V1_REUPLOAD_REQUIRED" &&
    status.requires_reupload === true &&
    status.reason_code === "LEGACY_CONTRACT_DATA_ONLY"
  );
}
