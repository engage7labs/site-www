import {
  getAdminEmail,
  getAdminPasswordHash,
  SESSION_COOKIE_NAME,
  SESSION_HOURS,
  signJwt,
  verifyPassword,
} from "@/lib/auth-server";
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

    const adminEmail = getAdminEmail();
    const adminHash = getAdminPasswordHash();

    // Constant-time-ish comparison via bcrypt — always runs the hash
    const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
    const passMatch = await verifyPassword(password, adminHash);

    if (!emailMatch || !passMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signJwt({ sub: adminEmail, role: "user" });

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
