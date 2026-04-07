/**
 * Centralized application configuration.
 *
 * All environment-specific values are read from environment variables.
 * Two environments are supported: dev (local) and prod (production).
 */

/**
 * Ensure a URL has a protocol prefix. If the value looks like a hostname
 * (e.g. "api.dev.engage7.ie") without "http://" or "https://", prepend
 * "https://". This prevents the browser from treating it as a relative path.
 */
export function ensureProtocol(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // localhost without protocol → http, everything else → https
  if (url.startsWith("localhost") || url.startsWith("127.0.0.1"))
    return `http://${url}`;
  return `https://${url}`;
}

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

const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "production";

export const config = {
  appEnv,
  apiBaseUrl: ensureProtocol(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  ),
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-IE",
  siteUrl: getDefaultSiteUrl(appEnv),

  // Build identity — injected at build time by CI
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
  gitSha: process.env.NEXT_PUBLIC_GIT_SHA ?? "unknown",
  buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown",
} as const;
