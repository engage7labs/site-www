"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/locale-provider";
import {
  consumePendingPublicClaimForToast,
  readPublicClaimToastCandidateJobId,
} from "@/lib/public-analysis-claim";
import {
  trackClaimImportCompleted,
  trackClaimImportStarted,
  trackPortalOpened,
} from "@/lib/telemetry";
import { AdminViewBanner } from "../admin-view-banner";
import { PasswordSetupAlert } from "./password-setup-alert";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";
import { TrialExpiredBanner } from "./trial-expired-banner";

const STORAGE_KEY = "engage7_portal_sidebar_collapsed";
const OVERVIEW_HEADER_EVENT = "engage7:overview-header-subtitle";

export function PortalShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overviewSubtitle, setOverviewSubtitle] = useState<string | null>(null);
  const publicClaimToastAttemptedRef = useRef(false);
  const { t } = useLocale();
  const sectionTitles = {
    "/portal": t.portal.shell.sections.overview,
    "/portal/reports": t.portal.shell.sections.reports,
    "/portal/trends": t.portal.shell.sections.dataLab,
    "/portal/insights": t.portal.shell.sections.insights,
    "/portal/settings": t.portal.shell.sections.settings,
    "/portal/upload": t.portal.shell.sections.upload,
    "/portal/health": t.portal.shell.sections.health,
    "/portal/health/all": t.portal.shell.sections.all,
    "/portal/health/sleep": t.portal.shell.sections.sleep,
    "/portal/health/recovery": t.portal.shell.sections.recovery,
    "/portal/health/activity": t.portal.shell.sections.activity,
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    trackPortalOpened();
  }, []);

  useEffect(() => {
    const candidateJobId = readPublicClaimToastCandidateJobId();
    if (!candidateJobId || publicClaimToastAttemptedRef.current) return;
    publicClaimToastAttemptedRef.current = true;

    const run = async () => {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      if (!sessionResponse.ok) return;
      const session = (await sessionResponse.json().catch(() => null)) as {
        role?: string;
        mode?: string;
        read_only?: boolean;
      } | null;
      if (session?.mode === "admin_view" || session?.read_only === true) return;
      if (session?.role !== "user") return;

      trackClaimImportStarted(candidateJobId);
      try {
        const decision = await consumePendingPublicClaimForToast();
        if (!decision) return;
        trackClaimImportCompleted(decision.job_id);
        if (decision.final_status === "blocked") {
          toast.error(t.portal.shell.protectedClaimBlocked);
          return;
        }
        if (decision.final_status === "failed") {
          toast.error(t.portal.shell.importStillFailed);
          return;
        }
        toast.success(
          decision.final_status === "already_imported"
            ? t.portal.shell.claimAlreadyImported
            : t.portal.shell.claimImported
        );
      } catch {
        trackClaimImportCompleted(candidateJobId, "failed");
        toast.message(t.portal.shell.claimReady, {
          description: t.portal.shell.claimRetryDescription,
          action: {
            label: t.portal.shell.retry,
            onClick: () => {
              void consumePendingPublicClaimForToast()
                .then((decision) => {
                  if (!decision) return;
                  if (decision.final_status === "blocked") {
                    toast.error(t.portal.shell.protectedClaimBlocked);
                    return;
                  }
                  if (decision.final_status === "failed") {
                    toast.error(t.portal.shell.importStillFailed);
                    return;
                  }
                  toast.success(
                    decision.final_status === "already_imported"
                      ? t.portal.shell.claimAlreadyImported
                      : t.portal.shell.imported
                  );
                })
                .catch(() =>
                  toast.error(t.portal.shell.importStillFailed),
                );
            },
          },
        });
      }
    };

    void run();
  }, [t.portal.shell]);

  useEffect(() => {
    const handleOverviewSubtitle = (event: Event) => {
      const detail = (event as CustomEvent<{ subtitle?: string | null }>).detail;
      setOverviewSubtitle(detail?.subtitle ?? null);
    };

    window.addEventListener(OVERVIEW_HEADER_EVENT, handleOverviewSubtitle);
    return () => {
      window.removeEventListener(OVERVIEW_HEADER_EVENT, handleOverviewSubtitle);
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const pathname = usePathname();
  const section =
    sectionTitles[pathname as keyof typeof sectionTitles] ??
    Object.entries(sectionTitles).find(([k]) =>
      pathname.startsWith(k + "/")
    )?.[1] ??
    undefined;
  const sectionSubtitle =
    pathname === "/portal" && overviewSubtitle
      ? overviewSubtitle
      : section?.subtitle;

  return (
    <div className="portal-surface flex min-h-screen text-foreground">
      <AdminViewBanner />
      <PortalSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        <PortalHeader
          onToggleMobile={toggleMobile}
          sectionTitle={section?.title}
          sectionSubtitle={sectionSubtitle}
        />

        <PasswordSetupAlert />
        <TrialExpiredBanner />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
