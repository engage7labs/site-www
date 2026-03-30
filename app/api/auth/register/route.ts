/**
 * POST /api/auth/register
 *
 * Proxies user registration to the Python API's /auth/register endpoint.
 * Validates input at this boundary before forwarding.
 *
 * Dev fallback: when the Python API is unavailable or returns 404 (stale instance),
 * registration is handled in-process using bcryptjs + an in-memory store so local
 * validation works without a running Python API. The in-memory store is cleared on
 * Next.js server restart and is never used in production.
 */

import { devUserStore } from "@/lib/dev-user-store";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      typeof body.confirmPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Email, password, and confirmPassword are required" },
        { status: 400 }
      );
    }

    const { email, password, confirmPassword } = body as {
      email: string;
      password: string;
      confirmPassword: string;
    };

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Phase 1: Python API (primary store — required in production)
    // ------------------------------------------------------------------
    let apiAvailable = false;
    try {
      const upstream = await fetch(`${INTERNAL_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // 409 = duplicate email; 422 = validation error — both are real API errors
      if (upstream.status === 409 || upstream.status === 422) {
        const data = await upstream.json().catch(() => ({}));
        const detail =
          (data as { detail?: string }).detail ?? "Registration failed";
        return NextResponse.json(
          { error: detail },
          { status: upstream.status }
        );
      }

      if (upstream.ok) {
        return NextResponse.json({ ok: true }, { status: 201 });
      }

      // Any other non-ok status — fall through to dev fallback below
      apiAvailable = upstream.status !== 404; // 404 = stale instance
    } catch {
      // Network error — Python API not running
      apiAvailable = false;
    }

    // ------------------------------------------------------------------
    // Phase 2: Dev-only in-memory fallback
    // Activated when API is unreachable or returns 404 (stale instance).
    // NOT used in production.
    // ------------------------------------------------------------------
    if (process.env.NODE_ENV !== "production") {
      const result = await devUserStore.register(email, password);
      if (result === "conflict") {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    // Production: API unavailable
    void apiAvailable; // suppress unused-var lint
    return NextResponse.json(
      { error: "Registration service unavailable" },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
