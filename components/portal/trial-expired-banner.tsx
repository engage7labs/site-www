/**
 * TrialExpiredBanner — Sprint 33.0
 *
 * Shows a calm upgrade prompt when:
 *   - plan === "trial" and trial_end_at < now  (trial expired)
 *   - plan === "expired"
 *
 * Fetches portal-overview to check plan status.
 * Dismissed per-session (sessionStorage).
 */
"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "engage7_trial_banner_dismissed";

interface OverviewData {
  plan: string;
  trial_end_at: string | null;
}

export function TrialExpiredBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) {
      setLoading(false);
      return;
    }
    fetch("/api/proxy/users/portal-overview")
      .then((r) => r.json())
      .then((d: OverviewData) => {
        const isExpiredPlan = d.plan === "expired";
        const isTrialExpired =
          d.plan === "trial" &&
          !!d.trial_end_at &&
          new Date(d.trial_end_at) < new Date();
        if (isExpiredPlan || isTrialExpired) setShow(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !show) return null;

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) throw new Error("checkout failed");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      window.location.href = "/portal/settings";
    }
  };

  return (
    <div className="mx-4 mt-3 sm:mx-6 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 flex items-center gap-3 text-sm">
      <span className="text-foreground/80 flex-1">
        Your free access period has ended.{" "}
        <button
          onClick={handleCheckout}
          className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
        >
          Continue for €7/month →
        </button>
      </span>
      <button
        onClick={() => {
          sessionStorage.setItem(DISMISSED_KEY, "1");
          setShow(false);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors text-xs shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
