/**
 * auth-edge.ts — Edge-runtime-safe auth primitives for Engage7 portal.
 *
 * Runs in Next.js middleware (Edge runtime).
 * MUST NOT import Node-only modules (crypto, bcryptjs, etc.).
 * Uses Web Crypto API (globalThis.crypto).
 *
 * Adapted from Pipeboard auth-edge.ts — same JWT structure.
 */

// ---------------------------------------------------------------------------
// Cookie name + session duration
// ---------------------------------------------------------------------------
export const SESSION_COOKIE_NAME = "engage7_session";
export const SESSION_HOURS = 12;

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

export function getJwtSecret(): string {
  const s = process.env.ENGAGE7_JWT_SECRET?.trim();
  if (!s) throw new Error("ENGAGE7_JWT_SECRET is required");
  return s;
}

// ---------------------------------------------------------------------------
// JWT payload type
// ---------------------------------------------------------------------------

export type SessionPayload = {
  sub: string; // email
  role: "user";
  iat: number;
  exp: number;
};

// ---------------------------------------------------------------------------
// Base64url helpers (Edge-safe — btoa/atob)
// ---------------------------------------------------------------------------

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  return atob(pad === 0 ? padded : padded + "===".slice(0, 4 - pad));
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 via Web Crypto
// ---------------------------------------------------------------------------

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function arrayBufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ---------------------------------------------------------------------------
// JWT sign (Edge-safe, async)
// ---------------------------------------------------------------------------

export async function signJwtEdge(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const key = await importHmacKey(secret);
  const enc = new TextEncoder();
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${header}.${body}`)
  );
  const sig = arrayBufferToBase64url(sigBuf);
  return `${header}.${body}.${sig}`;
}

// ---------------------------------------------------------------------------
// JWT verify (Edge-safe, async)
// ---------------------------------------------------------------------------

export async function verifyJwtEdge(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts as [string, string, string];

    const key = await importHmacKey(secret);
    const enc = new TextEncoder();

    const sigPadded = signature.replace(/-/g, "+").replace(/_/g, "/");
    const pad = sigPadded.length % 4;
    const sigBase64 =
      pad === 0 ? sigPadded : sigPadded + "===".slice(0, 4 - pad);
    const sigBytes = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(`${header}.${body}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(base64urlDecode(body)) as SessionPayload;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie validation — used by middleware
// ---------------------------------------------------------------------------

export async function isValidSession(
  cookieValue: string | undefined
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  const payload = await verifyJwtEdge(cookieValue);
  if (!payload || payload.role !== "user") return null;
  return payload;
}
