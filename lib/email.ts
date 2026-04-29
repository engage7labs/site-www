/**
 * Email delivery via Resend API — Sprint 17.4 / 17.7.
 *
 * Uses the Resend HTTP API directly (no SDK dependency) to send
 * transactional emails for password flows, premium welcome, and insight emails.
 *
 * Required env vars:
 *   RESEND_API_KEY     — Resend API key (re_...)
 *   EMAIL_FROM         — Verified sender (e.g. "noreply@engage7.ie")
 *   NEXT_PUBLIC_APP_URL — Application base URL for links in emails
 */

import { resolveCanonicalAppUrl } from "@/lib/canonical-app-url";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = (process.env.EMAIL_FROM ?? "Engage7 Labs <noreply@engage7.ie>").trim();
const APP_URL = resolveCanonicalAppUrl().appUrl;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
  statusCode?: number;
  provider?: "resend";
  providerStatus?: number;
  senderDomain?: string;
}

function getSenderDomain(sender: string): string {
  const bracketMatch = sender.match(/<[^@\s<>]+@([^>\s]+)>/);
  const plainMatch = sender.match(/@([^>\s]+)$/);
  return (bracketMatch?.[1] ?? plainMatch?.[1] ?? "unknown").toLowerCase();
}

const EMAIL_FROM_DOMAIN = getSenderDomain(EMAIL_FROM);

function getSafeResendMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: unknown };
    return typeof parsed.message === "string" ? parsed.message : "resend_error";
  } catch {
    return "resend_error";
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.error(
      JSON.stringify({
        event: "email_send_failed",
        provider: "resend",
        reason: "resend_api_key_missing",
        sender_domain: EMAIL_FROM_DOMAIN,
      })
    );
    return {
      ok: false,
      error: "Email service not configured",
      statusCode: 503,
      provider: "resend",
      senderDomain: EMAIL_FROM_DOMAIN,
    };
  }

  console.log(
    JSON.stringify({
      event: "email_send_attempt",
      provider: "resend",
      sender_domain: EMAIL_FROM_DOMAIN,
    })
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "unknown error");
    const message = getSafeResendMessage(body);
    console.error(
      JSON.stringify({
        event: "email_send_failed",
        provider: "resend",
        provider_status: res.status,
        sender_domain: EMAIL_FROM_DOMAIN,
        message,
      })
    );
    return {
      ok: false,
      error: `Email delivery failed (${res.status})`,
      statusCode: res.status === 403 ? 403 : 502,
      provider: "resend",
      providerStatus: res.status,
      senderDomain: EMAIL_FROM_DOMAIN,
    };
  }

  console.log(
    JSON.stringify({
      event: "email_send_succeeded",
      provider: "resend",
      sender_domain: EMAIL_FROM_DOMAIN,
    })
  );

  return {
    ok: true,
    provider: "resend",
    senderDomain: EMAIL_FROM_DOMAIN,
  };
}

export function passwordSetupEmail(resetUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Set your Engage7 password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Set your password</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to create a password for your Engage7 account.
          This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Set Password
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email.<br />
          This link will expire in 1 hour.
        </p>
      </div>
    `,
  };
}

export function passwordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Reset your Engage7 password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          Someone requested a password reset for your Engage7 account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Reset Password
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email.<br />
          This link will expire in 1 hour.
        </p>
      </div>
    `,
  };
}

export { APP_URL };

// ---------------------------------------------------------------------------
// Welcome Email — Sprint 30.1 (calm UX, magic link)
// ---------------------------------------------------------------------------

/**
 * Welcome email sent after first analysis + consent.
 * Uses a magic link for frictionless portal access.
 * Calm tone — no "Premium", no "password", no noise.
 *
 * @param accessLink - Magic link or portal URL for direct access
 */
export function welcomeEmail(accessLink: string): { subject: string; html: string } {
  return {
    subject: "Your health insights are ready",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f0f0f;color:#e5e7eb;">

    <p style="font-size:13px;color:#6b7280;margin:0 0 32px 0;letter-spacing:0.05em;text-transform:uppercase;">Engage7</p>

    <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 16px 0;line-height:1.3;">
      Your data is telling a story.
    </h1>

    <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin:0 0 12px 0;">
      We've analysed your Apple Health data and found patterns worth exploring.
    </p>

    <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin:0 0 32px 0;">
      Your personal dashboard is ready — built entirely from your own data.
    </p>

    <a href="${accessLink}"
       style="display:inline-block;background:#e6b800;color:#0f0f0f;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">
      Open your dashboard →
    </a>

    <p style="font-size:12px;color:#4b5563;margin:40px 0 0 0;line-height:1.6;">
      This link is private and opens directly to your data.<br>
      It stays active for 24 hours.
    </p>

    <hr style="border:none;border-top:1px solid #1f2937;margin:32px 0;">

    <p style="font-size:11px;color:#374151;margin:0;line-height:1.5;">
      Engage7 · Personal health insights · <a href="${APP_URL}/privacy" style="color:#4b5563;">Privacy Policy</a>
    </p>

  </div>
</body>
</html>`,
  };
}

/**
 * @deprecated Use welcomeEmail(magicLink) instead (Sprint 30.1).
 */
export function premiumWelcomeEmail(): { subject: string; html: string } {
  return welcomeEmail(`${APP_URL}/portal`);
}

// ---------------------------------------------------------------------------
// Insight Email — Sprint 17.7
// ---------------------------------------------------------------------------

export function insightEmail(insight: string): {
  subject: string;
  html: string;
} {
  const portalUrl = `${APP_URL}/portal/health`;
  return {
    subject: "New insight from your health data — Engage7",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">A new insight from your data</h2>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #166534; line-height: 1.6; margin: 0; font-size: 15px;">
            ${insight}
          </p>
        </div>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          Visit your dashboard to explore what this means and view your full
          longitudinal trends.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View in Dashboard
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          You received this because your latest analysis revealed a meaningful insight.<br />
          Engage7 — Personal health insights from your wearable data.
        </p>
      </div>
    `,
  };
}
