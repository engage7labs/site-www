/**
 * GET /admin/exit-view — Exit admin_view mode
 *
 * Sprint 17.1: Portal Observability
 * Clears session cookie and redirects to admin users page
 */

import { SESSION_COOKIE_NAME } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Clear session cookie
  const response = NextResponse.redirect(new URL("/admin/users", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
