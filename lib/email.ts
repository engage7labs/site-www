/**
 * Email delivery via Resend API — Sprint 17.4 / 17.7.
 *
 * Uses the Resend HTTP API directly (no SDK dependency) to send
 * transactional emails for password flows, premium welcome, and insight emails.
 *
 * Required env vars:
 *   RESEND_API_KEY     — Resend API key (re_...)
 *   EMAIL_FROM         — Verified sender (e.g. "Engage7 Labs <noreply@auth.engage7.ie>")
 *   NEXT_PUBLIC_APP_URL — Application base URL for links in emails
 */

import { resolveCanonicalAppUrl } from "@/lib/canonical-app-url";
import { normalizeLocale, type Locale } from "@/lib/i18n";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Engage7 Labs <noreply@engage7.ie>";
const APP_URL = resolveCanonicalAppUrl().appUrl;
const EMAIL_LOGO_URL = "https://www.engage7.ie/engage7-logo-180x180.png";
const EMAIL_LOGO_MARKUP = `    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" data-engage7-email-logo="true" style="border-collapse:collapse;margin:0 0 24px 0;">
      <tr>
        <td align="left" valign="top" style="padding:0;text-align:left;">
          <img
            src="${EMAIL_LOGO_URL}"
            alt="Engage7 Labs"
            width="120"
            height="120"
            style="display:block;margin:0 auto 0 0;width:120px;height:120px;border:0;outline:none;text-decoration:none;"
          />
        </td>
      </tr>
    </table>`;

interface EmailAttachment {
  filename: string;
  content: string;
  content_type: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
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

function getSenderAddress(sender: string): string {
  const bracketMatch = sender.match(/<([^@\s<>]+@[^>\s]+)>/);
  const plainMatch = sender.match(/([^<>\s]+@[^<>\s]+)$/);
  return (bracketMatch?.[1] ?? plainMatch?.[1] ?? "unknown").toLowerCase();
}

function hasSenderDisplayName(sender: string): boolean {
  return /^\s*[^<>\s][^<>]*<[^@\s<>]+@[^>\s]+>\s*$/.test(sender);
}

const EMAIL_FROM_DOMAIN = getSenderDomain(EMAIL_FROM);
const EMAIL_FROM_ADDRESS = getSenderAddress(EMAIL_FROM);
const EMAIL_FROM_HAS_DISPLAY_NAME = hasSenderDisplayName(EMAIL_FROM);

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
  attachments = [],
}: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.error(
      JSON.stringify({
        event: "email_send_failed",
        provider: "resend",
        reason: "resend_api_key_missing",
        email_from_has_display_name: EMAIL_FROM_HAS_DISPLAY_NAME,
        email_from_domain: EMAIL_FROM_DOMAIN,
        email_from_address: EMAIL_FROM_ADDRESS,
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
      email_from_has_display_name: EMAIL_FROM_HAS_DISPLAY_NAME,
      email_from_domain: EMAIL_FROM_DOMAIN,
      email_from_address: EMAIL_FROM_ADDRESS,
    })
  );

  const payload = {
    from: EMAIL_FROM,
    to: [to],
    subject,
    html,
    ...(attachments.length > 0
      ? { attachments }
      : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "unknown error");
    const message = getSafeResendMessage(body);
    console.error(
      JSON.stringify({
        event: "email_send_failed",
        provider: "resend",
        provider_status: res.status,
        email_from_has_display_name: EMAIL_FROM_HAS_DISPLAY_NAME,
        email_from_domain: EMAIL_FROM_DOMAIN,
        email_from_address: EMAIL_FROM_ADDRESS,
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
      email_from_has_display_name: EMAIL_FROM_HAS_DISPLAY_NAME,
      email_from_domain: EMAIL_FROM_DOMAIN,
      email_from_address: EMAIL_FROM_ADDRESS,
    })
  );

  return {
    ok: true,
    provider: "resend",
    senderDomain: EMAIL_FROM_DOMAIN,
  };
}

function authEmailLogoMarkup(): string {
  return EMAIL_LOGO_MARKUP;
}

const emailCopy: Record<
  Locale,
  {
    setup: {
      subject: string;
      title: string;
      body: string;
      button: string;
      footer: string;
    };
    reset: {
      subject: string;
      title: string;
      intro: string;
      body: string;
      button: string;
      footer: string;
      privacy: string;
      tagline: string;
    };
    welcome: {
      subject: string;
      title: string;
      intro: string;
      body: string;
      button: string;
      footer: string;
      privacy: string;
      tagline: string;
    };
    insight: {
      subject: string;
      title: string;
      intro: string;
      button: string;
      footer: string;
    };
  }
> = {
  en: {
    setup: {
      subject: "Set your Engage7 password",
      title: "Set your password",
      body: "Click the button below to create a password for your Engage7 account. This link expires in 1 hour.",
      button: "Set Password",
      footer:
        "If you didn't request this, you can safely ignore this email.<br />This link will expire in 1 hour.",
    },
    reset: {
      subject: "Reset your Engage7 password",
      title: "Reset your password.",
      intro:
        "We received a request to reset the password for your Engage7 account.",
      body:
        "Use the private link below to choose a new password. This link expires in 1 hour.",
      button: "Reset password →",
      footer:
        "If you didn't request this, you can safely ignore this email.<br>This link will expire in 1 hour.",
      privacy: "Privacy Policy",
      tagline: "Personal health insights",
    },
    welcome: {
      subject: "Your health insights are ready",
      title: "Your data is telling a story.",
      intro:
        "We've analysed your Apple Health data and found patterns worth exploring.",
      body: "Your personal dashboard is ready — built entirely from your own data.",
      button: "Open your dashboard →",
      footer:
        "This link is private and opens directly to your data.<br>It stays active for 24 hours.",
      privacy: "Privacy Policy",
      tagline: "Personal health insights",
    },
    insight: {
      subject: "New insight from your health data — Engage7",
      title: "A new insight from your data",
      intro:
        "Visit your dashboard to explore what this means and view your full longitudinal trends.",
      button: "View in Dashboard",
      footer:
        "You received this because your latest analysis revealed a meaningful insight.<br />Engage7 — Personal health insights from your wearable data.",
    },
  },
  "pt-BR": {
    setup: {
      subject: "Defina sua senha do Engage7",
      title: "Defina sua senha",
      body: "Clique no botão abaixo para criar uma senha para sua conta Engage7. Este link expira em 1 hora.",
      button: "Definir senha",
      footer:
        "Se você não solicitou isso, pode ignorar este email com segurança.<br />Este link expira em 1 hora.",
    },
    reset: {
      subject: "Redefina sua senha do Engage7",
      title: "Redefina sua senha.",
      intro:
        "Recebemos uma solicitação para redefinir a senha da sua conta Engage7.",
      body:
        "Use o link privado abaixo para escolher uma nova senha. Este link expira em 1 hora.",
      button: "Redefinir senha →",
      footer:
        "Se você não solicitou isso, pode ignorar este email com segurança.<br>Este link expira em 1 hora.",
      privacy: "Política de Privacidade",
      tagline: "Insights pessoais de saúde",
    },
    welcome: {
      subject: "Seus insights de saúde estão prontos",
      title: "Seus dados estão contando uma história.",
      intro:
        "Analisamos seus dados do Apple Health e encontramos padrões que vale explorar.",
      body:
        "Seu painel pessoal está pronto — construído inteiramente a partir dos seus próprios dados.",
      button: "Abrir seu painel →",
      footer:
        "Este link é privado e abre diretamente os seus dados.<br>Ele fica ativo por 24 horas.",
      privacy: "Política de Privacidade",
      tagline: "Insights pessoais de saúde",
    },
    insight: {
      subject: "Novo insight dos seus dados de saúde — Engage7",
      title: "Um novo insight dos seus dados",
      intro:
        "Acesse seu painel para explorar o que isso significa e ver suas tendências longitudinais completas.",
      button: "Ver no painel",
      footer:
        "Você recebeu isto porque sua análise mais recente revelou um insight relevante.<br />Engage7 — insights pessoais de saúde a partir dos seus dados.",
    },
  },
};

function copyFor(locale?: string): (typeof emailCopy)[Locale] {
  return emailCopy[normalizeLocale(locale)];
}

export function passwordSetupEmail(resetUrl: string, locale: Locale = "en"): {
  subject: string;
  html: string;
} {
  const copy = copyFor(locale).setup;
  return {
    subject: copy.subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">${copy.title}</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          ${copy.body}
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          ${copy.button}
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          ${copy.footer}
        </p>
      </div>
    `,
  };
}

export function passwordResetEmail(resetUrl: string, locale: Locale = "en"): {
  subject: string;
  html: string;
} {
  const copy = copyFor(locale).reset;
  return {
    subject: copy.subject,
    html: `<!DOCTYPE html>
<html lang="${normalizeLocale(locale)}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f0f0f;color:#e5e7eb;">

${authEmailLogoMarkup()}

    <p style="font-size:13px;color:#6b7280;margin:0 0 32px 0;letter-spacing:0.05em;text-transform:uppercase;">Engage7</p>

    <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 16px 0;line-height:1.3;">
      ${copy.title}
    </h1>

    <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin:0 0 12px 0;">
      ${copy.intro}
    </p>

    <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin:0 0 32px 0;">
      ${copy.body}
    </p>

    <a href="${resetUrl}"
       style="display:inline-block;background:#e6b800;color:#0f0f0f;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">
      ${copy.button}
    </a>

    <p style="font-size:12px;color:#4b5563;margin:40px 0 0 0;line-height:1.6;">
      ${copy.footer}
    </p>

    <hr style="border:none;border-top:1px solid #1f2937;margin:32px 0;">

    <p style="font-size:11px;color:#374151;margin:0;line-height:1.5;">
      Engage7 · ${copy.tagline} · <a href="${APP_URL}/privacy" style="color:#4b5563;">${copy.privacy}</a>
    </p>

  </div>
</body>
</html>`,
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
export function welcomeEmail(accessLink: string, locale: Locale = "en"): { subject: string; html: string } {
  const copy = copyFor(locale).welcome;
  return {
    subject: copy.subject,
    html: `<!DOCTYPE html>
<html lang="${normalizeLocale(locale)}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f0f0f;color:#e5e7eb;">

${authEmailLogoMarkup()}

    <p style="font-size:13px;color:#6b7280;margin:0 0 32px 0;letter-spacing:0.05em;text-transform:uppercase;">Engage7</p>

    <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 16px 0;line-height:1.3;">
      ${copy.title}
    </h1>

    <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin:0 0 12px 0;">
      ${copy.intro}
    </p>

    <p style="font-size:15px;color:#9ca3af;line-height:1.7;margin:0 0 32px 0;">
      ${copy.body}
    </p>

    <a href="${accessLink}"
       style="display:inline-block;background:#e6b800;color:#0f0f0f;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">
      ${copy.button}
    </a>

    <p style="font-size:12px;color:#4b5563;margin:40px 0 0 0;line-height:1.6;">
      ${copy.footer}
    </p>

    <hr style="border:none;border-top:1px solid #1f2937;margin:32px 0;">

    <p style="font-size:11px;color:#374151;margin:0;line-height:1.5;">
      Engage7 · ${copy.tagline} · <a href="${APP_URL}/privacy" style="color:#4b5563;">${copy.privacy}</a>
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

export function insightEmail(insight: string, locale: Locale = "en"): {
  subject: string;
  html: string;
} {
  const portalUrl = `${APP_URL}/portal/health`;
  const copy = copyFor(locale).insight;
  return {
    subject: copy.subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">${copy.title}</h2>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #166534; line-height: 1.6; margin: 0; font-size: 15px;">
            ${insight}
          </p>
        </div>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          ${copy.intro}
        </p>
        <a href="${portalUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          ${copy.button}
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          ${copy.footer}
        </p>
      </div>
    `,
  };
}
