/**
 * Server-only configuration.
 *
 * Values here are NOT exposed to the browser — they are only available
 * in Next.js API routes and server components.
 */

import { ensureProtocol } from "@/lib/config";

function readNonEmptyEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Internal API base URL for server-side proxy calls (no NEXT_PUBLIC_ prefix). */
export const INTERNAL_API_BASE_URL = ensureProtocol(
  readNonEmptyEnv("API_BASE_URL") ??
    readNonEmptyEnv("NEXT_PUBLIC_API_BASE_URL") ??
    "http://127.0.0.1:8000"
);

/** HMAC signing secret shared with the API. */
export const SIGNING_SECRET = process.env.ENGAGE7_SIGNING_SECRET ?? "";

/** Key ID sent with signed requests — must match API config. */
export const SIGNING_KEY_ID =
  process.env.ENGAGE7_SIGNING_KEY_ID ?? "engage7-web";
