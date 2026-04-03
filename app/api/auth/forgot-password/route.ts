/**
 * POST /api/auth/forgot-password
 *
 * Generates a time-limited password reset token (JWT) and sends
 * a reset email via Resend. Sprint 17.4.
 *
 * The token is a stateless JWT signed with the same HMAC secret,
 * containing { sub: email, purpose: "password_reset", exp: +1h }.
 */

import { signJwt } from "@/lib/auth-server";
import { APP_URL, passwordResetEmail, sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 422 }
    );
  }

  // Always return success to prevent email enumeration.
  // Generate and send the token regardless — if the user doesn't exist
  // they simply won't be able to reset (the set-password endpoint will 404).
  const now = Math.floor(Date.now() / 1000);
  const resetToken = signJwt({
    sub: email,
    role: "user",
    purpose: "password_reset",
    exp: now + 3600, // 1 hour
  } as Parameters<typeof signJwt>[0] & { purpose: string });

  const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(
    resetToken
  )}`;
  const { subject, html } = passwordResetEmail(resetUrl);

  await sendEmail({ to: email, subject, html });

  return NextResponse.json({ ok: true });
}
