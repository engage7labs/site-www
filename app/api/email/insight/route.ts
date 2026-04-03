/**
 * POST /api/email/insight — Sprint 17.7
 *
 * Sends a single-insight email to the authenticated user.
 * Anti-spam guard: one email per 7 days, tracked via HTTP-only cookie.
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { insightEmail, sendEmail } from "@/lib/email";
import { getPreviewInsight } from "@/lib/insights/preview-insight";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const INSIGHT_COOKIE = "engage7_last_insight_email";
const COOLDOWN_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Generic fallback text from preview-insight.ts — skip emailing this.
const GENERIC_FALLBACK =
  "Your data already shows patterns — Premium reveals what to do next.";

export async function POST(request: NextRequest) {
  // --- Auth ---
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Anti-spam guard ---
  const lastSent = cookieStore.get(INSIGHT_COOKIE)?.value;
  if (lastSent) {
    const elapsed = Date.now() - Number(lastSent);
    if (elapsed < COOLDOWN_SECONDS * 1000) {
      return NextResponse.json(
        { error: "Insight email already sent recently" },
        { status: 429 }
      );
    }
  }

  // --- Parse body ---
  let body: { sections?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sections = body.sections ?? null;

  // --- Generate insight ---
  const insight = getPreviewInsight(
    sections as Parameters<typeof getPreviewInsight>[0]
  );
  if (!insight || insight === GENERIC_FALLBACK) {
    return NextResponse.json(
      { error: "No meaningful insight to email" },
      { status: 422 }
    );
  }

  // --- Send email ---
  const { subject, html } = insightEmail(insight);
  const result = await sendEmail({ to: session.sub, subject, html });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Email delivery failed" },
      { status: 502 }
    );
  }

  // --- Set anti-spam cookie ---
  const res = NextResponse.json({ ok: true, insight });
  res.cookies.set(INSIGHT_COOKIE, String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOLDOWN_SECONDS,
  });

  return res;
}
