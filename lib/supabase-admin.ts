/**
 * supabase-admin.ts — Server-side Supabase admin client.
 *
 * Uses SERVICE_ROLE key — never expose to the browser.
 * Only import this in Next.js API routes (Node runtime).
 *
 * Sprint 30.1: Used to generate magic links for welcome email.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Lazy singleton — avoids build-time throw when env vars are absent
let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

/** Supabase admin client (lazy — only instantiated on first use). */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

/**
 * Generate a magic link for the given email.
 * Returns the action_link URL or null on failure.
 *
 * @param email - User email address
 * @param redirectTo - URL to redirect after verification (default: /portal)
 */
export async function generateMagicLink(
  email: string,
  redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://engage7.ie"}/auth/callback`
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (error || !data?.properties?.action_link) {
      console.error("[generateMagicLink] Supabase error:", error?.message);
      return null;
    }
    return data.properties.action_link;
  } catch (err) {
    console.error("[generateMagicLink] Unexpected error:", err);
    return null;
  }
}
