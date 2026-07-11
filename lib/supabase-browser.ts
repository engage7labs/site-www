"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase OAuth is not configured");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: false,
      flowType: "pkce",
      // PKCE verifier storage is still handled by auth-js, but the resulting
      // Supabase session is exchanged for HttpOnly server cookies.
      persistSession: false,
    },
  });
}
