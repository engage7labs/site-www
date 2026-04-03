/**
 * Email delivery via Resend API — Sprint 17.4.
 *
 * Uses the Resend HTTP API directly (no SDK dependency) to send
 * transactional emails for password setup & recovery flows.
 *
 * Required env vars:
 *   RESEND_API_KEY     — Resend API key (re_...)
 *   EMAIL_FROM         — Verified sender (e.g. "noreply@engage7.ie")
 *   NEXT_PUBLIC_APP_URL — Application base URL for links in emails
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Engage7 <noreply@engage7.ie>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://engage7.ie";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured — email not sent");
    return { ok: false, error: "Email service not configured" };
  }

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
    console.error(`[email] Resend API error ${res.status}: ${body}`);
    return { ok: false, error: `Email delivery failed (${res.status})` };
  }

  return { ok: true };
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
