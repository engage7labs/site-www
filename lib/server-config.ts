/**
 * Server-only configuration.
 *
 * Values here are NOT exposed to the browser — they are only available
 * in Next.js API routes and server components.
 */

import { ensureProtocol } from "@/lib/config";

type ApiBaseUrlSource =
  | "ENGAGE7_API_BASE_URL"
  | "default";

interface ApiBaseUrlResolution {
  source: ApiBaseUrlSource;
  value: string;
}

function readNonEmptyEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function normalizeApiBaseUrl(name: ApiBaseUrlSource, rawValue: string): string {
  const withProtocol = ensureProtocol(rawValue);
  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`${name} must be an http(s) URL for the Engage7 API.`);
  }

  const isAllowedProtocol =
    parsed.protocol === "http:" || parsed.protocol === "https:";
  const isAllowedHost =
    parsed.hostname === "localhost" ||
    isIpAddress(parsed.hostname) ||
    parsed.hostname.includes(".");

  if (!isAllowedProtocol || !isAllowedHost) {
    throw new Error(`${name} must be a valid Engage7 API URL.`);
  }

  return parsed.origin;
}

function isProductionLikeRuntime(): boolean {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();

  return (
    appEnv === "prod" ||
    appEnv === "production" ||
    vercelEnv === "production" ||
    vercelEnv === "preview" ||
    process.env.VERCEL === "1"
  );
}

function resolveInternalApiBaseUrl(): ApiBaseUrlResolution {
  const serverApiBaseUrl = readNonEmptyEnv("ENGAGE7_API_BASE_URL");

  if (serverApiBaseUrl) {
    return {
      source: "ENGAGE7_API_BASE_URL",
      value: normalizeApiBaseUrl("ENGAGE7_API_BASE_URL", serverApiBaseUrl),
    };
  }

  if (isProductionLikeRuntime()) {
    throw new Error(
      "ENGAGE7_API_BASE_URL must be configured with an http(s) Engage7 API URL for server-side runtime routes."
    );
  }

  return {
    source: "default",
    value: "http://127.0.0.1:8000",
  };
}

export const API_BASE_URL_RESOLUTION = resolveInternalApiBaseUrl();

/** Engage7 API base URL for server-side proxy calls. */
export const INTERNAL_API_BASE_URL = API_BASE_URL_RESOLUTION.value;

/** HMAC signing secret shared with the API. */
export const SIGNING_SECRET = process.env.ENGAGE7_SIGNING_SECRET ?? "";

/** Key ID sent with signed requests — must match API config. */
export const SIGNING_KEY_ID =
  process.env.ENGAGE7_SIGNING_KEY_ID ?? "engage7-web";
