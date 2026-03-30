/**
 * HMAC-SHA256 request signing for the web → API security boundary.
 *
 * Generates the three headers required by the API's SignatureVerificationMiddleware:
 *   X-Engage7-Key-Id
 *   X-Engage7-Timestamp
 *   X-Engage7-Signature
 */

import { SIGNING_KEY_ID, SIGNING_SECRET } from "@/lib/server-config";
import { createHmac } from "crypto";

export interface SignatureHeaders {
  "X-Engage7-Key-Id": string;
  "X-Engage7-Timestamp": string;
  "X-Engage7-Signature": string;
}

/**
 * Compute HMAC-SHA256 signature headers for a request.
 * Returns empty object when no signing secret is configured (dev mode).
 */
export function signRequest(
  method: string,
  path: string,
  bodyHash = ""
): Partial<SignatureHeaders> {
  if (!SIGNING_SECRET) return {};

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const canonical = `${method}\n${path}\n${timestamp}\n${bodyHash}`;
  const signature = createHmac("sha256", SIGNING_SECRET)
    .update(canonical)
    .digest("hex");

  return {
    "X-Engage7-Key-Id": SIGNING_KEY_ID,
    "X-Engage7-Timestamp": timestamp,
    "X-Engage7-Signature": signature,
  };
}
