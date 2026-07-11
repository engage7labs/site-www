"use client";

/**
 * /auth/callback — Supabase Auth callback handler.
 *
 * Handles existing magic-link hash tokens and Google OAuth PKCE code returns,
 * then exchanges the Supabase session for Engage7's app session cookie.
 *
 * Shows a minimal loading state — user should not see this for more than 1-2s.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { safeAuthRedirectPath } from "@/lib/auth-redirects";
import { detectLocale, getDictionary, normalizeLocale } from "@/lib/i18n";
import {
  fetchAuthSessionSnapshot,
  publishAuthSessionChanged,
} from "@/lib/auth-session-client";
import { rememberPendingPublicClaim } from "@/lib/public-analysis-claim";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const GOOGLE_SESSION_RETRY_DELAYS_MS = [0, 250, 500, 750, 1000, 1000] as const;
const APP_SESSION_RETRY_DELAYS_MS = [0, 500, 1000, 1000, 1000] as const;
const APP_SESSION_VERIFY_DELAYS_MS = [0, 100, 250, 500, 1000] as const;
const TRANSIENT_APP_SESSION_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function logGoogleCallback(
  event: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  if (process.env.NODE_ENV === "production") return;
  console.debug("[auth:google_callback]", {
    provider: "google",
    event,
    ...details,
  });
}

async function waitForSupabaseSession(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
): Promise<Session | null> {
  for (const [retryCount, delayMs] of GOOGLE_SESSION_RETRY_DELAYS_MS.entries()) {
    if (delayMs > 0) await sleep(delayMs);

    const { data, error } = await supabase.auth.getSession();
    const session = data.session ?? null;
    logGoogleCallback("session_retry", {
      retry_count: retryCount,
      session_found: Boolean(session?.access_token),
      has_error: Boolean(error),
    });

    if (session?.access_token) return session;
  }

  return null;
}

async function waitForAppSession(): Promise<boolean> {
  for (const delayMs of APP_SESSION_VERIFY_DELAYS_MS) {
    if (delayMs > 0) await sleep(delayMs);
    const session = await fetchAuthSessionSnapshot().catch(() => null);
    if (session?.authenticated) return true;
  }

  return false;
}

async function createAppSession(params: {
  accessToken: string;
  refreshToken: string;
  tokenType: string | null;
  redirectTo: string;
  preferredLocale: string;
}) {
  let lastFailure: { status: number; error?: string } | null = null;

  for (const [retryCount, delayMs] of APP_SESSION_RETRY_DELAYS_MS.entries()) {
    if (delayMs > 0) await sleep(delayMs);

    const res = await fetch("/api/auth/magic-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        type: params.tokenType,
        redirect_to: params.redirectTo,
        preferred_locale: params.preferredLocale,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      redirect_to?: string;
      error?: string;
      error_code?: string;
    };

    logGoogleCallback("app_session_retry", {
      retry_count: retryCount,
      status: res.status,
      session_found: res.ok,
    });

    if (res.ok && (await waitForAppSession())) {
      return { ok: true as const, redirectTo: data.redirect_to };
    }

    lastFailure = {
      status: res.ok ? 425 : res.status,
      error: data.error_code === "google_sync_failed" ? undefined : data.error,
    };
    if (!res.ok && !TRANSIENT_APP_SESSION_STATUSES.has(res.status)) break;
  }

  return {
    ok: false as const,
    status: lastFailure?.status ?? 0,
    error: lastFailure?.error,
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [copy, setCopy] = useState(getDictionary("en").auth.callback);
  const startedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const search = new URLSearchParams(window.location.search);
      const locale = normalizeLocale(search.get("locale") ?? detectLocale());
      const localizedCopy = getDictionary(locale).auth.callback;
      setCopy(localizedCopy);

      const claimJobId = search.get("claim_job_id");
      if (claimJobId) rememberPendingPublicClaim(claimJobId);

      const redirectTo = safeAuthRedirectPath(search.get("next") ?? "/portal");
      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.slice(1)) : null;
      let accessToken = hashParams?.get("access_token") ?? null;
      let refreshToken = hashParams?.get("refresh_token") ?? null;
      const tokenType = hashParams?.get("type") ?? null;
      const code = search.get("code");

      if (!accessToken && code) {
        logGoogleCallback("callback_entered", { has_code: true });
        const supabase = createSupabaseBrowserClient();
        try {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          accessToken = data.session?.access_token ?? null;
          refreshToken = data.session?.refresh_token ?? null;
        } catch {
          logGoogleCallback("code_exchange_failed");
          const settledSession = await waitForSupabaseSession(supabase);
          accessToken = settledSession?.access_token ?? null;
          refreshToken = settledSession?.refresh_token ?? null;
          if (!accessToken) {
            setError(localizedCopy.generic);
            return;
          }
        }

        if (!accessToken) {
          const settledSession = await waitForSupabaseSession(supabase);
          accessToken = settledSession?.access_token ?? null;
          refreshToken = settledSession?.refresh_token ?? null;
        }
      }

      if (!accessToken || !refreshToken) {
        logGoogleCallback("session_failed", { reason: "missing_access_token" });
        setError(localizedCopy.invalid);
        return;
      }

      try {
        logGoogleCallback("app_session_exchange_started");
        const result = await createAppSession({
          accessToken,
          refreshToken,
          tokenType,
          redirectTo,
          preferredLocale: locale,
        });
        if (result.ok) {
          const finalRedirect = safeAuthRedirectPath(result.redirectTo ?? "/portal");
          logGoogleCallback("redirect", { redirect_to: finalRedirect });
          publishAuthSessionChanged("login");
          router.replace(finalRedirect);
        } else {
          logGoogleCallback("app_session_exchange_failed", {
            status: result.status,
            has_error: Boolean(result.error),
          });
          setError(result.error ?? localizedCopy.generic);
        }
      } catch {
        logGoogleCallback("connection_failed");
        setError(localizedCopy.connection);
      }
    };

    void run();
  }, [router]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f0f",
          color: "#9ca3af",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "15px", marginBottom: "16px" }}>{error}</p>
        <a
          href="/login"
          style={{ color: "#e6b800", fontSize: "14px", textDecoration: "none" }}
        >
          {copy.back}
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f0f",
        color: "#6b7280",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
      }}
    >
      {copy.loading}
    </div>
  );
}
