/**
 * Server-only configuration.
 *
 * Values here are NOT exposed to the browser — they are only available
 * in Next.js API routes and server components.
 */

/** Internal API base URL for server-side proxy calls (no NEXT_PUBLIC_ prefix). */
export const INTERNAL_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000";

/** HMAC signing secret shared with the API. */
export const SIGNING_SECRET = process.env.ENGAGE7_SIGNING_SECRET ?? "";

/** Key ID sent with signed requests — must match API config. */
export const SIGNING_KEY_ID =
  process.env.ENGAGE7_SIGNING_KEY_ID ?? "engage7-web";
