/**
 * POST /api/auth/reset-password
 *
 * Proxies reset-password requests to the backend API.
 *
 * Backward compatibility:
 * - Preferred upstream: /auth/reset-password
 * - Fallback (when upstream is 404): verify reset token here and call /auth/set-password
 */

import { signRequest } from "@/lib/api/signing";
import {
  claimAuthTokenUse,
  completeAuthTokenUse,
  isAuthTokenConsumed,
  releaseAuthTokenUse,
} from "@/lib/auth-token-consumption";
import { verifyJwt } from "@/lib/auth-server";
import { ensureProtocol } from "@/lib/config";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function logPasswordReset(event: string, fields: Record<string, unknown>): void {
  // Never log raw reset tokens, JWTs, token hashes, or full reset URLs.
  console.log(JSON.stringify({ event, ...fields }));
}

function resetTokenError(status = 401): NextResponse {
  return NextResponse.json(
    {
      error:
        "This link has already been used or has expired. Please request a new access link.",
    },
    { status }
  );
}

async function releasePasswordResetClaim(token: string): Promise<void> {
  const release = await releaseAuthTokenUse(token, "password_reset");
  if (!release.ok) {
    logPasswordReset("password_reset_token_consumption_failed", {
      purpose: "password_reset",
      reason: release.error ?? "release_failed",
    });
  }
}

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  }

  if (
    !body.password ||
    typeof body.password !== "string" ||
    body.password.length < 8
  ) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 422 }
    );
  }

  const payload = verifyJwt(body.token);
  if (!payload?.sub) {
    return resetTokenError();
  }

  const purposeField = (payload as Record<string, unknown>).purpose;
  if (purposeField !== "password_reset") {
    return NextResponse.json({ error: "Invalid reset token" }, { status: 401 });
  }

  const email = payload.sub.trim().toLowerCase();
  const tokenExpiresAt =
    typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null;

  logPasswordReset("password_reset_token_consumption_check", {
    purpose: "password_reset",
  });
  const consumed = await isAuthTokenConsumed(body.token, "password_reset");
  if (!consumed.ok) {
    logPasswordReset("password_reset_token_consumption_failed", {
      purpose: "password_reset",
      reason: consumed.error ?? "unknown",
    });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  if (consumed.alreadyConsumed) {
    logPasswordReset("password_reset_token_reuse_blocked", {
      purpose: "password_reset",
    });
    return resetTokenError();
  }

  const claim = await claimAuthTokenUse({
    token: body.token,
    purpose: "password_reset",
    subject: email,
    expiresAt: tokenExpiresAt,
  });
  if (!claim.ok) {
    if (claim.alreadyConsumed) {
      logPasswordReset("password_reset_token_reuse_blocked", {
        purpose: "password_reset",
      });
      return resetTokenError();
    }

    logPasswordReset("password_reset_token_consumption_failed", {
      purpose: "password_reset",
      reason: claim.error ?? "unknown",
    });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const apiBaseUrl = ensureProtocol(
    process.env.API_BASE_URL ?? INTERNAL_API_BASE_URL
  );
  const path = "/auth/reset-password";

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    await releasePasswordResetClaim(body.token);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (upstream.status !== 404) {
    const data = await upstream
      .json()
      .catch(() => ({ error: "Upstream error" }));

    if (!upstream.ok) {
      await releasePasswordResetClaim(body.token);
      return NextResponse.json(data, { status: upstream.status });
    }

    const completion = await completeAuthTokenUse(body.token, "password_reset");
    if (!completion.ok) {
      logPasswordReset("password_reset_token_consumption_failed", {
        purpose: "password_reset",
        reason: completion.error ?? "unknown",
      });
    } else {
      logPasswordReset("password_reset_token_consumed", {
        purpose: "password_reset",
      });
    }

    return NextResponse.json(data, { status: upstream.status });
  }

  const fallbackPath = "/auth/set-password";
  const sigHeaders = signRequest("POST", fallbackPath);

  let fallbackUpstream: Response;
  try {
    fallbackUpstream = await fetch(`${apiBaseUrl}${fallbackPath}`, {
      method: "POST",
      headers: { ...sigHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: body.password }),
    });
  } catch {
    await releasePasswordResetClaim(body.token);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const fallbackData = await fallbackUpstream
    .json()
    .catch(() => ({ error: "Upstream error" }));

  if (!fallbackUpstream.ok) {
    await releasePasswordResetClaim(body.token);
    return NextResponse.json(fallbackData, { status: fallbackUpstream.status });
  }

  const completion = await completeAuthTokenUse(body.token, "password_reset");
  if (!completion.ok) {
    logPasswordReset("password_reset_token_consumption_failed", {
      purpose: "password_reset",
      reason: completion.error ?? "unknown",
    });
  } else {
    logPasswordReset("password_reset_token_consumed", {
      purpose: "password_reset",
    });
  }

  return NextResponse.json(fallbackData, { status: fallbackUpstream.status });
}
