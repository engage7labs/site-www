"use client";

/**
 * /auth/callback — Supabase Auth callback handler.
 *
 * Handles existing magic-link hash tokens and Google OAuth PKCE code returns,
 * then exchanges the Supabase session for Engage7's app session cookie.
 *
 * Shows a minimal loading state — user should not see this for more than 1-2s.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { safeAuthRedirectPath } from "@/lib/auth-redirects";
import { detectLocale } from "@/lib/i18n";
import { rememberPendingPublicClaim } from "@/lib/public-analysis-claim";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const CALLBACK_COPY = {
  en: {
    loading: "Signing you in with Google...",
    invalid: "Invalid or expired link. Please request a new one.",
    generic: "Could not continue with Google. Please try again or use email.",
    connection: "Connection error. Please try again.",
    back: "Back to login",
  },
  "pt-BR": {
    loading: "Entrando com Google...",
    invalid: "Link inválido ou expirado. Solicite um novo link.",
    generic: "Não foi possível continuar com Google. Tente novamente ou use e-mail.",
    connection: "Erro de conexão. Tente novamente.",
    back: "Voltar para o login",
  },
} as const;

type CallbackCopy = (typeof CALLBACK_COPY)[keyof typeof CALLBACK_COPY];

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [copy, setCopy] = useState<CallbackCopy>(CALLBACK_COPY.en);

  useEffect(() => {
    const run = async () => {
      const search = new URLSearchParams(window.location.search);
      const locale = search.get("locale") ?? detectLocale();
      const localizedCopy = locale === "pt-BR" ? CALLBACK_COPY["pt-BR"] : CALLBACK_COPY.en;
      setCopy(localizedCopy);

      const claimJobId = search.get("claim_job_id");
      if (claimJobId) rememberPendingPublicClaim(claimJobId);

      const redirectTo = safeAuthRedirectPath(search.get("next") ?? "/portal");
      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.slice(1)) : null;
      let accessToken = hashParams?.get("access_token") ?? null;
      const tokenType = hashParams?.get("type") ?? null;
      const code = search.get("code");

      if (!accessToken && code) {
        try {
          const supabase = createSupabaseBrowserClient();
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          accessToken = data.session?.access_token ?? null;
        } catch {
          setError(localizedCopy.generic);
          return;
        }
      }

      if (!accessToken) {
        setError(localizedCopy.invalid);
        return;
      }

      try {
        const res = await fetch("/api/auth/magic-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: accessToken,
            type: tokenType,
            redirect_to: redirectTo,
            preferred_locale: locale,
          }),
        });
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            redirect_to?: string;
          };
          router.replace(safeAuthRedirectPath(data.redirect_to ?? "/portal"));
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? localizedCopy.generic);
        }
      } catch {
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
