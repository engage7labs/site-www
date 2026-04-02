import { SESSION_COOKIE_NAME, isValidSession } from "@/lib/auth-edge";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/portal", "/api/portal"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await isValidSession(cookie);

  if (!session) {
    // API routes get 401; pages redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("unauth", "1");
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Inject identity header for downstream use
  const res = NextResponse.next();
  res.headers.set("x-engage7-user", session.sub);
  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/api/portal/:path*"],
};
