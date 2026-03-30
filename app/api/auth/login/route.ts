import {
  getAdminEmail,
  getAdminPasswordHash,
  SESSION_COOKIE_NAME,
  SESSION_HOURS,
  signJwt,
  verifyPassword,
} from "@/lib/auth-server";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Phase 1: env-var admin account (always present, no DB required)
    // ------------------------------------------------------------------
    let authenticatedEmail: string | null = null;

    try {
      const adminEmail = getAdminEmail();
      const adminHash = getAdminPasswordHash();
      const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
      const passMatch = await verifyPassword(password, adminHash);
      if (emailMatch && passMatch) {
        authenticatedEmail = adminEmail;
      }
    } catch {
      // Admin env vars not configured — skip
    }

    // ------------------------------------------------------------------
    // Phase 2: DB-registered users
    // 2a: dev in-memory store (when Python API is unavailable)
    // 2b: Python API (production / running API)
    // ------------------------------------------------------------------
    if (!authenticatedEmail && process.env.NODE_ENV !== "production") {
      try {
        const { devUserStore } = await import("@/lib/dev-user-store");
        const devOk = await devUserStore.verify(email, password);
        if (devOk) {
          authenticatedEmail = email.toLowerCase().trim();
        }
      } catch {
        // ignore
      }
    }

    if (!authenticatedEmail) {
      try {
        const upstream = await fetch(`${INTERNAL_API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (upstream.ok) {
          const data = (await upstream.json()) as { email?: string };
          authenticatedEmail = data.email ?? email.toLowerCase().trim();
        }
      } catch {
        // Python API unreachable — fall through to 401
      }
    }

    if (!authenticatedEmail) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signJwt({ sub: authenticatedEmail, role: "user" });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 3600,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
