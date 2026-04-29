/**
 * supabase-admin.ts — Server-side Supabase admin client.
 *
 * Uses SERVICE_ROLE key — never expose to the browser.
 * Only import this in Next.js API routes (Node runtime).
 *
 * Sprint 30.1: Used to generate magic links for welcome email.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveMagicLinkRedirect } from "@/lib/canonical-app-url";

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

function logMagicLink(event: string, fields: Record<string, unknown>): void {
  // Never log Supabase action links, fragments, access tokens, or refresh tokens.
  console.log(JSON.stringify({ event, ...fields }));
}

function resolveRedirectFields(redirectTo: string): {
  redirectTo: string;
  redirectHost: string;
  redirectPath: string;
  redirectToApplied: boolean;
} {
  try {
    const url = new URL(redirectTo);
    const redirectToApplied =
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.pathname === "/auth/callback";

    return {
      redirectTo: url.toString(),
      redirectHost: url.hostname,
      redirectPath: url.pathname,
      redirectToApplied,
    };
  } catch {
    const fallback = resolveMagicLinkRedirect();
    return {
      redirectTo: fallback.redirectTo,
      redirectHost: fallback.redirectHost,
      redirectPath: fallback.redirectPath,
      redirectToApplied: true,
    };
  }
}

function getSafeRedirectPath(value: string | null): string {
  if (!value) return "missing";
  try {
    return new URL(value).pathname;
  } catch {
    return "invalid";
  }
}

function applyRedirectToActionLink(
  actionLink: string,
  redirect: ReturnType<typeof resolveRedirectFields>
): { actionLink: string; actionRedirectPath: string; redirectToApplied: boolean } {
  const url = new URL(actionLink);
  const currentRedirectTo = url.searchParams.get("redirect_to");
  const currentRedirectPath = getSafeRedirectPath(currentRedirectTo);
  const redirectToApplied = currentRedirectTo === redirect.redirectTo;

  if (!redirectToApplied) {
    url.searchParams.set("redirect_to", redirect.redirectTo);
  }

  return {
    actionLink: url.toString(),
    actionRedirectPath: redirectToApplied ? currentRedirectPath : redirect.redirectPath,
    redirectToApplied: true,
  };
}

/**
 * Generate a magic link for the given email.
 * Returns the action_link URL or null on failure.
 *
 * @param email - User email address
 * @param redirectTo - URL to redirect after verification (default: /auth/callback)
 */
export async function generateMagicLink(
  email: string,
  redirectTo = resolveMagicLinkRedirect().redirectTo
): Promise<string | null> {
  const redirect = resolveRedirectFields(redirectTo);

  logMagicLink("magic_link_redirect_resolved", {
    redirect_host: redirect.redirectHost,
    redirect_path: redirect.redirectPath,
    redirect_to_applied: redirect.redirectToApplied,
  });

  const options = {
    redirectTo: redirect.redirectTo,
  };

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options,
    });
    if (error || !data?.properties?.action_link) {
      logMagicLink("magic_link_generation_failed", {
        redirect_host: redirect.redirectHost,
        redirect_path: redirect.redirectPath,
        redirect_to_applied: redirect.redirectToApplied,
        reason: error?.message ?? "missing_action_link",
      });
      return null;
    }
    const actionLink = data.properties.action_link;
    const normalizedActionLink = applyRedirectToActionLink(actionLink, redirect);

    logMagicLink("magic_link_generation_succeeded", {
      redirect_host: redirect.redirectHost,
      redirect_path: redirect.redirectPath,
      action_redirect_path: normalizedActionLink.actionRedirectPath,
      redirect_to_applied: normalizedActionLink.redirectToApplied,
      has_action_link: true,
    });
    return normalizedActionLink.actionLink;
  } catch (err) {
    logMagicLink("magic_link_generation_failed", {
      redirect_host: redirect.redirectHost,
      redirect_path: redirect.redirectPath,
      redirect_to_applied: redirect.redirectToApplied,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

function isAlreadyRegisteredError(message: string | undefined): boolean {
  const normalized = (message ?? "").toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists")
  );
}

export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const targetEmail = email.trim().toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("[findAuthUserIdByEmail] Supabase error:", error.message);
      return null;
    }

    const users = data?.users ?? [];
    const match = users.find(
      (user) => user.email?.trim().toLowerCase() === targetEmail
    );
    if (match?.id) return match.id;
    if (users.length < perPage) return null;
  }

  return null;
}

/**
 * Ensure Supabase Auth owns the canonical UUID for this email before the API
 * inserts public.users. public.users.id is constrained to auth.users.id in PROD.
 */
export async function ensureSupabaseAuthUser(email: string): Promise<{
  ok: boolean;
  userId?: string;
  reason?: string;
  created?: boolean;
}> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (!error && data?.user?.id) {
      return { ok: true, userId: data.user.id, created: true };
    }

    if (error && isAlreadyRegisteredError(error.message)) {
      const existingId = await findAuthUserIdByEmail(email);
      if (existingId) {
        return { ok: true, userId: existingId, created: false };
      }
      return {
        ok: false,
        reason: "auth_user_exists_but_lookup_failed",
      };
    }

    return {
      ok: false,
      reason: error?.message ?? "supabase_create_user_returned_no_user",
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function deleteSupabaseAuthUser(userId: string): Promise<{
  ok: boolean;
  reason?: string;
  alreadyAbsent?: boolean;
}> {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (!error) return { ok: true };

    const message = error.message ?? "";
    if (message.toLowerCase().includes("not found")) {
      return { ok: true, reason: "auth_user_already_absent", alreadyAbsent: true };
    }

    return { ok: false, reason: message || "supabase_delete_user_failed" };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
