import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    sub: session.sub,
    email: session.sub,
    role: session.role,
    mode: session.mode,
    read_only: session.read_only === true,
    view_as_user_id: session.view_as_user_id,
  });
}
