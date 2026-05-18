"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PortalOverviewSettingsData {
  plan?: string | null;
  trial_end_at?: string | null;
  feature_store?: {
    date_end?: string | null;
    row_count?: number | null;
  } | null;
}

function formatSettingsDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SettingsPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [timelineDateEnd, setTimelineDateEnd] = useState<string | null>(null);
  const [timelineRows, setTimelineRows] = useState<number | null>(null);
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [protectionLoading, setProtectionLoading] = useState(true);
  const [protectionSaving, setProtectionSaving] = useState(false);
  const [protectionError, setProtectionError] = useState<string | null>(null);

  useEffect(() => {
    const ps = searchParams.get("payment");
    if (ps === "success" || ps === "cancelled") {
      setPaymentStatus(ps);
      // Clean up URL
      router.replace("/portal/settings");
    }
    // Fetch plan status
    fetch("/api/proxy/users/portal-overview")
      .then((r) => r.json())
      .then((d: PortalOverviewSettingsData) => {
        setPlan(d.plan ?? null);
        setTrialEnd(d.trial_end_at ?? null);
        setTimelineDateEnd(d.feature_store?.date_end ?? null);
        setTimelineRows(d.feature_store?.row_count ?? null);
      })
      .catch(() => {});
    fetch("/api/proxy/users/health-footprint")
      .then((r) => r.json())
      .then((d: { protection_enabled?: boolean }) => {
        setProtectionEnabled(d.protection_enabled !== false);
        setProtectionLoading(false);
      })
      .catch(() => {
        setProtectionError("Protection settings are unavailable right now.");
        setProtectionLoading(false);
      });
  }, [searchParams, router]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Checkout unavailable");
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
      setCheckoutLoading(false);
    }
  };
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const canDelete = confirmText === "DELETE";
  void locale;
  const protectionCopy = {
    title: "Protect data updates",
    description:
      "Helps prevent Apple Health exports from another person being merged into your timeline. Engage7 compares privacy-minimized metadata before updating your processed timeline.",
    on: "On",
    off: "Off",
    active:
      "Protection is active. Strong mismatches may be blocked before your timeline is changed.",
    inactive:
      "Protection is off. Future updates may be accepted even when the dataset looks different from your previous timeline.",
    saving: "Saving...",
    error: "Could not save this setting.",
  };

  const handleProtectionToggle = async () => {
    const next = !protectionEnabled;
    setProtectionEnabled(next);
    setProtectionSaving(true);
    setProtectionError(null);
    try {
      const res = await fetch("/api/proxy/users/health-footprint", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protection_enabled: next }),
      });
      const data = await res.json().catch(() => ({})) as { protection_enabled?: boolean; detail?: string };
      if (!res.ok) throw new Error(data.detail ?? protectionCopy.error);
      setProtectionEnabled(data.protection_enabled !== false);
    } catch (err) {
      setProtectionEnabled(!next);
      setProtectionError(err instanceof Error ? err.message : protectionCopy.error);
    } finally {
      setProtectionSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/proxy/users/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { detail?: string; error?: string }).detail ||
            (data as { detail?: string; error?: string }).error ||
            "Deletion failed. Please try again."
        );
      }
      // Session cookie cleared by proxy on success — show success then redirect
      setDeleted(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="rounded-full bg-emerald-500/10 p-4">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground">Account deleted</p>
        <p className="text-sm text-muted-foreground">
          Your Engage7 account deletion has completed. Redirecting…
        </p>
      </div>
    );
  }

  const isPremium = plan === "premium";
  const trialEndDate = trialEnd ? new Date(trialEnd) : null;
  const trialActive = plan === "trial" && trialEndDate && trialEndDate > new Date();
  const trialExpired = (plan === "trial" && trialEndDate && trialEndDate <= new Date()) || plan === "expired";
  const daysLeft = trialActive && trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86400000))
    : null;
  const formattedTimelineDate = formatSettingsDate(timelineDateEnd);

  return (
    <div className="flex flex-col gap-6">

      {/* Payment success / cancelled notification */}
      {paymentStatus === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          ✓ Payment confirmed — your account has been upgraded to Premium.
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Payment was cancelled. Your plan is unchanged.
        </div>
      )}

      {/* Billing section — Sprint 33.0 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground mb-1">Plan &amp; Billing</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {isPremium && "You are on Premium — thank you for your support."}
          {trialActive && `Free access active${daysLeft !== null ? ` — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining` : ""}.`}
          {trialExpired && "Your free access period has ended."}
          {plan === "trial_start" && "Your account is being activated."}
          {!plan && "Loading…"}
        </p>
        {!isPremium && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-card-foreground">Engage7 Premium</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full dashboard · Unlimited analyses · Longitudinal trends · Personal insights
                </p>
              </div>
              <p className="text-sm font-bold text-accent shrink-0">€7 / month</p>
            </div>
            {checkoutError && (
              <p className="text-xs text-destructive">{checkoutError}</p>
            )}
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? "Redirecting…" : "Upgrade to Premium →"}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Account section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            Account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Engage7 account controls Portal access, plan state, settings,
            and account deletion.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Supabase stores login and control-plane metadata. Raw Apple Health
            XML is not stored in Supabase.
          </p>
        </div>

        {/* Profile section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            Profile
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Account details and preferences will be configurable here in a
            future update.
          </p>
        </div>

        {/* Export placeholder */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            Export / Download
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A self-serve export center is not available yet. Your reports remain
            available in My Reports, and account deletion is available below.
          </p>
        </div>
      </div>

      {/* Data & Privacy section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">
          Data &amp; Privacy
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Engage7 uses your Apple Health export to build a processed
          physiological timeline. Raw upload files are temporary. Processed
          daily features and report artifacts may be kept so your Portal can
          show Health, Insights, Data Lab, and My Reports.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Raw ZIP/XML", "Temporary Azure Blob storage under lifecycle rules."],
            ["Processed timeline", "Used for Portal dashboards and freshness."],
            ["Reports", "Kept so you can reopen completed analyses."],
            ["Account metadata", "Stored for login, plan, and settings."],
            ["Delete account", "Removes app-owned account data."],
          ].map(([label, description]) => (
            <div
              key={label}
              className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
            >
              <p className="text-xs font-semibold text-card-foreground">
                {label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Azure Blob Storage holds raw and processed artifacts according to
          lifecycle rules. Supabase stores account, control-plane, report, and
          timeline metadata needed to run the authenticated Portal.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">
              {protectionCopy.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {protectionCopy.description}
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              This is not medical identity verification. It uses
              privacy-minimized metadata and does not expose raw Apple Health
              content, raw device details, date of birth, or sex in Settings.
              You can turn it off for testing or intentional advanced cases.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {protectionSaving
                ? protectionCopy.saving
                : protectionEnabled
                  ? protectionCopy.active
                  : protectionCopy.inactive}
            </p>
            {protectionError && (
              <p className="mt-2 text-xs text-destructive">{protectionError}</p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={protectionEnabled}
            onClick={handleProtectionToggle}
            disabled={protectionLoading || protectionSaving}
            className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              protectionEnabled
                ? "border-emerald-500/40 bg-emerald-500/30"
                : "border-border bg-muted"
            }`}
          >
            <span className="sr-only">{protectionCopy.title}</span>
            <span
              className={`inline-block h-6 w-6 rounded-full bg-background shadow transition-transform ${
                protectionEnabled ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
          <span className={protectionEnabled ? "font-medium text-foreground" : ""}>
            {protectionCopy.on}
          </span>
          <span className={!protectionEnabled ? "font-medium text-foreground" : ""}>
            {protectionCopy.off}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold text-card-foreground">
              Timeline protection
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {protectionLoading
                ? "Loading..."
                : protectionEnabled
                  ? "On"
                  : "Off"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold text-card-foreground">
              Processed timeline
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {timelineRows && timelineRows > 0 ? "Available" : "Not available"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold text-card-foreground">
              Latest data through
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formattedTimelineDate ?? "Not available"}
            </p>
          </div>
        </div>
      </div>

      {/* Delete account section */}
      <div className="rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="text-sm font-semibold text-destructive">
          Delete my account and data
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This deletes your Engage7 account and app-owned data. Reports,
          processed timeline metadata, data update events, and footprint records
          are removed by app cleanup and database cascade behavior. Temporary
          raw upload files are governed by Azure storage lifecycle rules. This
          action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmText("");
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
          className="mt-4 inline-flex items-center rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          Delete account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Confirm account deletion
            </h3>
            <p className="text-sm text-muted-foreground">
              This will delete your Engage7 account and app-owned Portal data.
              Raw temporary upload files remain governed by storage lifecycle
              rules. To confirm, type{" "}
              <span className="font-mono font-bold text-foreground">
                DELETE
              </span>{" "}
              below.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-destructive"
              autoComplete="off"
            />
            {deleteError && (
              <p className="text-xs text-destructive">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canDelete || deleting}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
