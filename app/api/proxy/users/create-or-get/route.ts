import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, signJwt, verifyJwt } from "@/lib/auth-server";
import { resolveCanonicalAppUrl } from "@/lib/canonical-app-url";
import { welcomeEmail, sendEmail } from "@/lib/email";
import { normalizeLocale, type Locale } from "@/lib/i18n";
import { generateMagicLink } from "@/lib/supabase-admin";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_30_DAYS = 30 * 24 * 3600;

function callbackUrl(jobId: string | undefined, locale: Locale): string {
  const url = new URL("/auth/callback", resolveCanonicalAppUrl().appUrl);
  url.searchParams.set("next", "/portal");
  url.searchParams.set("locale", locale);
  if (jobId) url.searchParams.set("claim_job_id", jobId);
  return url.toString();
}

async function sendVerifiedAccessEmail(
  email: string,
  jobId: string | undefined,
  locale: Locale,
) {
  const magicLink = await generateMagicLink(email, callbackUrl(jobId, locale));
  if (!magicLink) return { status: "magic_link_failed", magic_link_used: true };
  const template = welcomeEmail(magicLink, locale);
  const result = await sendEmail({ to: email, subject: template.subject, html: template.html });
  return {
    status: result.ok ? "sent" : "send_failed",
    magic_link_used: true,
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ detail: "Invalid request" }, { status: 400 });
  }
  const parsed = rawBody as {
    email?: unknown;
    job_id?: unknown;
    preferred_locale?: unknown;
  };
  const locale = normalizeLocale(
    typeof parsed.preferred_locale === "string" ? parsed.preferred_locale : undefined,
  );
  const session = verifyJwt(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "");

  if (!session?.user_id) {
    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ detail: "Invalid email address" }, { status: 422 });
    }
    const delivery = await sendVerifiedAccessEmail(
      email,
      typeof parsed.job_id === "string" ? parsed.job_id : undefined,
      locale,
    ).catch(() => ({ status: "send_failed", magic_link_used: true }));
    // No app session, consent, or ownership is created until Supabase verifies
    // the person and the callback resumes the pending consent-gated claim.
    return NextResponse.json(
      { ok: true, authentication_required: true, email_delivery: delivery },
      { status: 202 },
    );
  }

  const path = "/api/users/create-or-get";
  const forwardedBody = JSON.stringify({
    ...parsed,
    email: session.sub,
    user_id: session.user_id,
    preferred_locale: locale,
  });
  let upstream: Response;
  try {
    upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...signRequest("POST", path),
        "X-User-Id": session.user_id,
        "X-User-Email": session.sub,
      },
      body: forwardedBody,
    });
  } catch {
    return NextResponse.json({ detail: "User service unavailable" }, { status: 503 });
  }
  const data = await upstream.json().catch(() => ({ detail: "Upstream error" }));
  const response = NextResponse.json(data, { status: upstream.status });
  if (upstream.ok && data.email && data.id === session.user_id) {
    response.cookies.set(
      SESSION_COOKIE_NAME,
      signJwt({
        sub: data.email,
        user_id: session.user_id,
        role: data.role === "admin" ? "admin" : session.role,
        exp: Math.floor(Date.now() / 1000) + SESSION_30_DAYS,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_30_DAYS,
      },
    );
  }
  return response;
}
