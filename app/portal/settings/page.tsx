"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PortalOverviewSettingsData {
  plan?: string | null;
  plan_display?: string | null;
  plan_status?: string | null;
  consent_status?: string | null;
  trial_end_at?: string | null;
  feature_store?: {
    date_end?: string | null;
    row_count?: number | null;
  } | null;
  preferred_locale?: string | null;
}

interface CurrentUserSettingsData {
  email?: string | null;
}

function formatSettingsDate(value: string | null, locale: Locale): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SettingsPage() {
  const { locale, setSessionLocale, t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"email" | "final">("email");
  const [emailConfirmText, setEmailConfirmText] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [planDisplay, setPlanDisplay] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [timelineDateEnd, setTimelineDateEnd] = useState<string | null>(null);
  const [timelineRows, setTimelineRows] = useState<number | null>(null);
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [protectionLoading, setProtectionLoading] = useState(true);
  const [protectionSaving, setProtectionSaving] = useState(false);
  const [protectionError, setProtectionError] = useState<string | null>(null);
  const [preferredLocale, setPreferredLocale] = useState<Locale>(locale);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageStatus, setLanguageStatus] = useState<"saved" | "error" | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

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
        setPlanDisplay(d.plan_display ?? null);
        setPlanStatus(d.plan_status ?? null);
        setTrialEnd(d.trial_end_at ?? null);
        setTimelineDateEnd(d.feature_store?.date_end ?? null);
        setTimelineRows(d.feature_store?.row_count ?? null);
        if (d.preferred_locale === "pt-BR" || d.preferred_locale === "en") {
          setPreferredLocale(d.preferred_locale);
        }
      })
      .catch(() => {});
    fetch("/api/proxy/users/me")
      .then((r) => r.json())
      .then((d: CurrentUserSettingsData) => {
        if (typeof d.email === "string" && d.email.trim()) {
          setAccountEmail(d.email.trim().toLowerCase());
        }
      })
      .catch(() => {});
    fetch("/api/proxy/users/health-footprint")
      .then((r) => r.json())
      .then((d: { protection_enabled?: boolean }) => {
        setProtectionEnabled(d.protection_enabled !== false);
        setProtectionLoading(false);
      })
      .catch(() => {
        setProtectionError(t.portal.settings.protection.unavailable);
        setProtectionLoading(false);
      });
  }, [searchParams, router, t.portal.settings.protection.unavailable]);

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

  const normalizedEmailConfirmation = emailConfirmText.trim().toLowerCase();
  const canContinueDelete =
    Boolean(accountEmail) && normalizedEmailConfirmation === accountEmail;
  const protectionCopy = t.portal.settings.protection;

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep("email");
    setEmailConfirmText("");
    setEmailCopied(false);
    setDeleteError(null);
  };

  const copyAccountEmail = async () => {
    if (!accountEmail) return;
    try {
      await navigator.clipboard.writeText(accountEmail);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1500);
    } catch {
      setEmailCopied(false);
    }
  };

  const handlePreferredLocaleSave = async () => {
    setLanguageSaving(true);
    setLanguageStatus(null);
    try {
      const res = await fetch("/api/proxy/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_locale: preferredLocale }),
      });
      if (!res.ok) throw new Error(t.portal.settings.languageError);
      setSessionLocale(preferredLocale);
      setLanguageStatus("saved");
    } catch {
      setLanguageStatus("error");
    } finally {
      setLanguageSaving(false);
    }
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
    if (deleteStep !== "final" || !canContinueDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/proxy/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation_email: normalizedEmailConfirmation }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
            (data as { detail?: string; error?: string }).detail ||
            (data as { detail?: string; error?: string }).error ||
            t.portal.settings.deleteFailed
        );
      }
      // Session cookie cleared by proxy on success — show success then redirect
      setDeleted(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : t.portal.settings.deleteUnexpected
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
        <p className="text-lg font-medium text-foreground">{t.portal.settings.deletedTitle}</p>
        <p className="text-sm text-muted-foreground">
          {t.portal.settings.deletedBody}
        </p>
      </div>
    );
  }

  const isPremium = planDisplay === "Premium" || plan === "premium";
  const trialEndDate = trialEnd ? new Date(trialEnd) : null;
  const trialActive = planStatus === "trialing" && trialEndDate && trialEndDate > new Date();
  const trialExpired = planStatus === "expired";
  const daysLeft = trialActive && trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86400000))
    : null;
  const formattedTimelineDate = formatSettingsDate(timelineDateEnd, locale);

  return (
    <div className="flex flex-col gap-6">

      {/* Payment success / cancelled notification */}
      {paymentStatus === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {t.portal.settings.paymentSuccess}
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {t.portal.settings.paymentCancelled}
        </div>
      )}

      {/* Billing section — Sprint 33.0 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground mb-1">
          {t.portal.settings.planBilling}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {isPremium && t.portal.settings.premiumThanks}
          {trialActive &&
            `${t.portal.settings.freeAccessActive}${
              daysLeft !== null
                ? ` — ${t.portal.settings.daysRemaining
                    .replace("{count}", String(daysLeft))
                    .replaceAll("{plural}", daysLeft === 1 ? "" : "s")}`
                : ""
            }.`}
          {trialExpired && t.portal.settings.freeAccessEnded}
          {planDisplay === "No plan" && t.portal.settings.noPlanActive}
          {!planDisplay && t.portal.loading}
        </p>
        {!isPremium && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-card-foreground">
                  {t.portal.settings.premiumName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.portal.settings.premiumDescription}
                </p>
              </div>
              <p className="text-sm font-bold text-accent shrink-0">
                {t.portal.settings.premiumPrice}
              </p>
            </div>
            {checkoutError && (
              <p className="text-xs text-destructive">{checkoutError}</p>
            )}
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? t.common.redirecting : t.portal.settings.upgradeToPremium}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Account section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            {t.portal.settings.accountTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.portal.settings.accountBody}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t.portal.settings.accountNote}
          </p>
        </div>

        {/* Profile section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            {t.portal.settings.profileTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.portal.settings.profileBody}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            {t.portal.settings.languageTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.portal.settings.languageBody}
          </p>
          <select
            value={preferredLocale}
            onChange={(event) => setPreferredLocale(event.target.value as Locale)}
            className="mt-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_NAMES[loc]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handlePreferredLocaleSave}
            disabled={languageSaving}
            className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
          >
            {languageSaving ? t.common.saving : t.common.save}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.portal.settings.languageSessionNote}
          </p>
          {languageStatus === "saved" && (
            <p className="mt-2 text-xs text-emerald-400">
              {t.portal.settings.languageSaved}
            </p>
          )}
          {languageStatus === "error" && (
            <p className="mt-2 text-xs text-destructive">
              {t.portal.settings.languageError}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">
          {t.portal.settings.exportTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.portal.settings.exportBody}
        </p>
      </div>

      {/* Data & Privacy section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">
          {t.portal.settings.dataPrivacyTitle}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {t.portal.settings.dataPrivacyBody}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.values(t.portal.settings.privacyItems).map(([label, description]) => (
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
          {t.portal.settings.dataPrivacyFooter}
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
              {protectionCopy.note}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {protectionSaving
                ? t.common.saving
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
              {protectionCopy.timelineProtection}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {protectionLoading
                ? t.common.loading
                : protectionEnabled
                  ? protectionCopy.on
                  : protectionCopy.off}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold text-card-foreground">
              {protectionCopy.processedTimeline}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {timelineRows && timelineRows > 0 ? t.common.available : t.common.notAvailable}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold text-card-foreground">
              {protectionCopy.latestDataThrough}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formattedTimelineDate ?? t.common.notAvailable}
            </p>
          </div>
        </div>
      </div>

      {/* Delete account section */}
      <div className="rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="text-sm font-semibold text-destructive">
          {t.portal.settings.deleteTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.portal.settings.deleteBody}
        </p>
        <button
          type="button"
          onClick={() => {
            setDeleteStep("email");
            setEmailConfirmText("");
            setEmailCopied(false);
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
          className="mt-4 inline-flex items-center rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          {t.portal.settings.deleteButton}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={resetDeleteModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {deleteStep === "email"
                ? t.portal.settings.deleteConfirmTitle
                : t.portal.settings.deleteFinalTitle}
            </h3>
            {deleteStep === "email" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {t.portal.settings.deleteConfirmBody}
                </p>
                <div className="rounded-lg border border-border bg-background/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.portal.settings.accountEmailLabel}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 break-all font-mono text-sm text-foreground">
                      {accountEmail ?? t.portal.settings.accountEmailLoading}
                    </p>
                    <button
                      type="button"
                      onClick={copyAccountEmail}
                      disabled={!accountEmail}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {emailCopied
                        ? t.portal.settings.emailCopied
                        : t.portal.settings.copyEmail}
                    </button>
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.portal.settings.deleteEmailInstruction}
                  </span>
                  <input
                    type="email"
                    value={emailConfirmText}
                    onChange={(e) => setEmailConfirmText(e.target.value)}
                    placeholder={t.portal.settings.deleteEmailPlaceholder}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-destructive"
                    autoComplete="off"
                  />
                </label>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.portal.settings.deleteFinalBody}
              </p>
            )}
            {deleteError && (
              <p className="text-xs text-destructive">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={resetDeleteModal}
                disabled={deleting}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {deleteStep === "final"
                  ? t.portal.settings.deleteFinalCancel
                  : t.common.cancel}
              </button>
              {deleteStep === "email" ? (
                <button
                  type="button"
                  onClick={() => setDeleteStep("final")}
                  disabled={!canContinueDelete}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.portal.settings.deleteContinue}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!canContinueDelete || deleting}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting
                    ? t.portal.settings.deleting
                    : t.portal.settings.deleteFinalConfirm}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
