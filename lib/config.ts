/**
 * Centralized application configuration.
 *
 * All environment-specific values are read from environment variables.
 * Two environments are supported: dev (local) and prod (production).
 */
export const config = {
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "dev",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-IE",
} as const;
