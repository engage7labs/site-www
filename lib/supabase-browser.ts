"use client";

import { createClient } from "@supabase/supabase-js";
import { createPkceVerifierStorage } from "@/lib/supabase-pkce-storage";

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
      // Persist only the PKCE verifier across the external OAuth redirect.
      // Supabase access/refresh tokens remain excluded from browser storage
      // and are exchanged for Engage7 HttpOnly cookies by the callback route.
      persistSession: true,
      storage: createPkceVerifierStorage(window.sessionStorage),
    },
  });
}
