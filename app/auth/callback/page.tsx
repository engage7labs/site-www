"use client";

/**
 * /auth/callback — Magic link callback handler.
 *
 * Sprint 30.1: Supabase redirects here after magic link verification.
 * The URL contains hash params: #access_token=...&refresh_token=...&type=magiclink
 *
 * Flow:
 * 1. Extract access_token from URL hash
 * 2. POST to /api/auth/magic-callback to exchange for our session cookie
 * 3. Redirect to /portal
 *
 * Shows a minimal loading state — user should not see this for more than 1-2s.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      // No hash — redirect to login
      router.replace("/login");
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const tokenType = params.get("type");
    const redirectTo = new URLSearchParams(window.location.search).get("next") ?? "/portal";

    if (!accessToken) {
      setError("Invalid or expired link. Please request a new one.");
      return;
    }

    // Exchange Supabase access_token for our session cookie
    fetch("/api/auth/magic-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        type: tokenType,
        redirect_to: redirectTo,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            redirect_to?: string;
          };
          router.replace(data.redirect_to ?? "/portal");
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Something went wrong. Please try again.");
        }
      })
      .catch(() => {
        setError("Connection error. Please try again.");
      });
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
          Back to login
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
      Opening your dashboard…
    </div>
  );
}
