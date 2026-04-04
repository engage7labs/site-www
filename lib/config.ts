/**
 * Centralized application configuration.
 *
 * All environment-specific values are read from environment variables.
 * Two environments are supported: dev (local) and prod (production).
 */

// Helper: Determine fallback siteUrl based on environment
function getDefaultSiteUrl(appEnv: string): string {
  // If explicitly set via env var, use it
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Otherwise, derive from environment
  const isDev = appEnv === "dev" || appEnv === "development";
  return isDev ? "https://dev.engage7.ie" : "https://www.engage7.ie";
}

const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "dev";

export const config = {
  appEnv,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-IE",
  siteUrl: getDefaultSiteUrl(appEnv),

  // Build identity — injected at build time by CI
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
  gitSha: process.env.NEXT_PUBLIC_GIT_SHA ?? "unknown",
  buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown",
} as const;
