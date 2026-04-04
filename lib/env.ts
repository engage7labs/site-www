import { config } from "./config";

/**
 * Single source of truth for environment detection.
 * Supports both legacy ("dev"/"prod") and canonical ("development"/"production") values.
 */
export const isDevEnvironment =
  config.appEnv === "development" || config.appEnv === "dev";

export const environmentLabel = isDevEnvironment ? "DEV" : null;
