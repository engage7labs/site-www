/**
 * Server-side proxy: POST /api/proxy/users/create-or-get
 *
 * Forwards user creation requests to the API backend.
 * Sprint 15.0: Passwordless user creation with trial plan.
 * Sprint 15.2: Sets session cookie so user lands authenticated in portal.
 * Sprint 30.1: Magic link welcome email (calm UX). Session extended to 30 days.
 *              New users receive a magic link; returning users get a plain portal link.
 */

import { signRequest } from "@/lib/api/signing";
import { SESSION_COOKIE_NAME, signJwt } from "@/lib/auth-server";
import { welcomeEmail, sendEmail } from "@/lib/email";
import { generateMagicLink } from "@/lib/supabase-admin";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 30-day session — user should not have to re-authenticate frequently
const SESSION_30_DAYS = 30 * 24 * 3600;

export async function POST(request: NextRequest) {
  const path = "/api/users/create-or-get";
  const sigHeaders = signRequest("POST", path);
  const rawBody = await request.text();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body: rawBody,
    });
  } catch {
    return NextResponse.json(
      { detail: "User service unavailable" },
      { status: 503 }
    );
  }

  const data = await upstreamResponse
    .json()
    .catch(() => ({ detail: `Upstream error ${upstreamResponse.status}` }));

  const res = NextResponse.json(data, { status: upstreamResponse.status });

  if (upstreamResponse.ok && data.email) {
    // Sprint 30.1: 30-day session cookie
    const token = signJwt({
      sub: data.email,
      role: "user",
      exp: Math.floor(Date.now() / 1000) + SESSION_30_DAYS,
    });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_30_DAYS,
    });

    // Sprint 30.1: Welcome email with magic link for new users (plan=trial_start)
    // Returning users already have a session — no email needed.
    const isNewUser = data.plan === "trial_start";
    if (isNewUser) {
      void (async () => {
        try {
          // Generate magic link (30-day Supabase OTP) — falls back to portal URL
          const magicLink =
            (await generateMagicLink(data.email)) ??
            `${process.env.NEXT_PUBLIC_APP_URL ?? "https://engage7.ie"}/portal`;

          const email = welcomeEmail(magicLink);
          await sendEmail({ to: data.email, subject: email.subject, html: email.html });
        } catch (err) {
          console.error("[create-or-get] Welcome email failed:", err);
        }
      })();
    }
  }

  return res;
}
