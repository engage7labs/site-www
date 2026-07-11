import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";

export async function syncAuthenticatedAppUser(params: {
  userId: string;
  email: string;
  provider: "email" | "google";
  preferredLocale?: string;
}): Promise<"user" | "admin" | null> {
  const path = "/api/users/sync-authenticated";
  const upstream = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...signRequest("POST", path),
    },
    body: JSON.stringify({
      email: params.email,
      user_id: params.userId,
      auth_provider: params.provider,
      preferred_locale: params.preferredLocale,
    }),
    cache: "no-store",
  });
  if (!upstream.ok) return null;
  const data = (await upstream.json().catch(() => ({}))) as { role?: string };
  return data.role === "admin" ? "admin" : "user";
}
