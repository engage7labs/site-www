import { authenticatedSupabaseClient } from "@/lib/supabase-auth-server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COMPLETION_KEY = "engage7_onboarding_completed";

export async function GET(request: NextRequest) {
  const authenticated = await authenticatedSupabaseClient(request).catch(() => null);
  if (!authenticated) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await authenticated.client.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json(
      { detail: "Onboarding status is temporarily unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    completed: data.user.user_metadata?.[COMPLETION_KEY] === true,
  });
}

export async function PATCH(request: NextRequest) {
  const authenticated = await authenticatedSupabaseClient(request).catch(() => null);
  if (!authenticated) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { data: current, error: readError } = await authenticated.client.auth.getUser();
  if (readError || !current.user) {
    return NextResponse.json(
      { detail: "Onboarding status is temporarily unavailable" },
      { status: 503 },
    );
  }

  if (current.user.user_metadata?.[COMPLETION_KEY] !== true) {
    const { error } = await authenticated.client.auth.updateUser({
      data: { [COMPLETION_KEY]: true },
    });
    if (error) {
      return NextResponse.json(
        { detail: "Could not save onboarding status" },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({ completed: true });
}
