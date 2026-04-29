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
import { findAuthUserIdByEmail } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function logPasswordReset(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...fields }));
}

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

  // Return a generic accepted response for unknown emails to prevent account
  // enumeration, but do not send reset links to accounts that do not exist.
  try {
    const authUserId = await findAuthUserIdByEmail(email);
    if (!authUserId) {
      logPasswordReset("password_reset_skipped_user_not_found", {
        email,
      });
      return NextResponse.json({
        ok: true,
        status: "accepted",
        message:
          "If an account exists for this email, we'll send recovery instructions.",
      });
    }

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

    const emailResult = await sendEmail({ to: email, subject, html });
    if (!emailResult.ok) {
      logPasswordReset("password_reset_email_send_failed", {
        email,
        reason: emailResult.error ?? "unknown",
        provider: emailResult.provider ?? "resend",
        provider_status: emailResult.providerStatus,
        sender_domain: emailResult.senderDomain,
      });
      return NextResponse.json(
        {
          error: "We couldn't send the email right now. Please try again later.",
          code: "email_delivery_failed",
          email_delivery: {
            status: "failed",
            reason: emailResult.error ?? "send_failed",
          },
        },
        { status: emailResult.statusCode === 403 ? 502 : emailResult.statusCode ?? 502 }
      );
    }

    logPasswordReset("password_reset_email_send_succeeded", {
      email,
      sender_domain: emailResult.senderDomain,
    });
  } catch (err) {
    console.error("[forgot-password] internal error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
