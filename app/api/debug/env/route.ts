import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const publicApiBaseUrlKey = ["NEXT_PUBLIC", "API_BASE_URL"].join("_");
  const serverApiBaseUrlKey = ["API", "BASE_URL"].join("_");
  const nodeEnvKey = ["NODE", "ENV"].join("_");
  const publicApiBaseUrl = process.env[publicApiBaseUrlKey] ?? null;
  const serverApiBaseUrl = process.env[serverApiBaseUrlKey] ?? null;

  return NextResponse.json({
    NEXT_PUBLIC_API_BASE_URL: publicApiBaseUrl,
    API_BASE_URL: serverApiBaseUrl,
    nodeEnv: process.env[nodeEnvKey] ?? null,
  });
}
