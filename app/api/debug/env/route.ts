import { NextResponse } from "next/server";
import { API_BASE_URL_RESOLUTION } from "@/lib/server-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function envStatus(name: string): "present" | "missing" {
  return process.env[name]?.trim() ? "present" : "missing";
}

function isDebugEndpointDisabled(): boolean {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();

  return (
    appEnv === "prod" ||
    appEnv === "production" ||
    vercelEnv === "production" ||
    vercelEnv === "preview" ||
    process.env.VERCEL === "1"
  );
}

export async function GET() {
  if (isDebugEndpointDisabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const nodeEnvKey = ["NODE", "ENV"].join("_");

  return NextResponse.json({
    debugEnabled: true,
    resolvedApiBaseUrlSource: API_BASE_URL_RESOLUTION.source,
    env: {
      ENGAGE7_API_BASE_URL: envStatus("ENGAGE7_API_BASE_URL"),
      NEXT_PUBLIC_API_BASE_URL: envStatus("NEXT_PUBLIC_API_BASE_URL"),
    },
    nodeEnv: process.env[nodeEnvKey] ?? null,
    adminEnvLabel: process.env.NEXT_PUBLIC_ADMIN_ENV_LABEL?.trim() || null,
  });
}
