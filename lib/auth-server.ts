/**
 * auth-server.ts — Node-runtime auth helpers for Engage7 portal.
 *
 * Runs in API routes / Server Components (Node runtime).
 * MAY import Node-only modules (crypto, bcryptjs).
 *
 * Re-exports edge primitives so API routes only import this file.
 */

import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

export {
  getJwtSecret,
  isValidSession,
  SESSION_COOKIE_NAME,
  SESSION_HOURS,
  signJwtEdge,
  verifyJwtEdge,
  type SessionPayload,
} from "./auth-edge";

import { getJwtSecret, SESSION_HOURS, type SessionPayload } from "./auth-edge";

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

export function getAdminEmail(): string {
  const v = process.env.ENGAGE7_ADMIN_EMAIL?.trim();
  if (!v) throw new Error("ENGAGE7_ADMIN_EMAIL is required");
  return v;
}

export function getAdminPasswordHash(): string {
  const v = process.env.ENGAGE7_ADMIN_PASSWORD_HASH?.trim();
  if (!v) throw new Error("ENGAGE7_ADMIN_PASSWORD_HASH is required");
  return v;
}

// ---------------------------------------------------------------------------
// Synchronous JWT (Node crypto — for API routes)
// ---------------------------------------------------------------------------

function base64urlEncode(str: string): string {
  return Buffer.from(str).toString("base64url");
}

export function signJwt(
  payload: Omit<SessionPayload, "iat" | "exp"> & Partial<SessionPayload>
): string {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = {
    ...payload,
    iat: payload.iat ?? now,
    exp: payload.exp ?? now + SESSION_HOURS * 3600,
  };
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(full));
  const sig = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts as [string, string, string];
    const secret = getJwtSecret();
    const expected = createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (expected !== signature) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Password verification
// ---------------------------------------------------------------------------

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
