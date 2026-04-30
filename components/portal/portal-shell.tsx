"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  claimPendingPublicAnalysis,
  readPendingPublicClaim,
} from "@/lib/public-analysis-claim";
import { AdminViewBanner } from "../admin-view-banner";
import { PasswordSetupAlert } from "./password-setup-alert";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";
import { TrialExpiredBanner } from "./trial-expired-banner";

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/portal": {
    title: "Overview",
    subtitle: "Your health data at a glance",
  },
  "/portal/reports": {
    title: "Data Updates",
    subtitle: "Review timeline updates and generated health reports",
  },
  "/portal/trends": {
    title: "Trends",
    subtitle: "Multi-signal trends, correlations, baselines, and volatility",
  },
  "/portal/insights": {
    title: "Insights",
    subtitle:
      "Patterns detected from your data — based on your own history, not averages",
  },
  "/portal/settings": {
    title: "Settings",
    subtitle: "Manage your portal preferences",
  },
  "/portal/upload": {
    title: "Update Data",
    subtitle: "Refresh your Apple Health timeline",
  },
  "/portal/health": {
    title: "Health",
    subtitle: "Longitudinal Sleep, Recovery & Activity",
  },
  "/portal/health/sleep": {
    title: "Sleep",
    subtitle: "Sleep duration, stages, consistency, and efficiency",
  },
  "/portal/health/recovery": {
    title: "Recovery",
    subtitle: "HRV, heart rate, readiness, and baseline comparison",
  },
  "/portal/health/activity": {
    title: "Activity",
    subtitle: "Steps, energy, distance, and activity consistency",
  },
};

const STORAGE_KEY = "engage7_portal_sidebar_collapsed";

export function PortalShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    const pendingJobId = readPendingPublicClaim();
    if (!pendingJobId) return;

    void claimPendingPublicAnalysis()
      .then(() => {
        toast.success("Your public analysis is now in your Portal.");
      })
      .catch(() => {
        toast.message("Your analysis is ready to import.", {
          description:
            "We could not import it automatically. You can retry now.",
          action: {
            label: "Retry",
            onClick: () => {
              void claimPendingPublicAnalysis()
                .then(() => toast.success("Analysis imported."))
                .catch(() =>
                  toast.error("Import still did not complete. Please try again later."),
                );
            },
          },
        });
      });
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
    SECTION_TITLES[pathname] ??
    Object.entries(SECTION_TITLES).find(([k]) =>
      pathname.startsWith(k + "/")
    )?.[1] ??
    undefined;

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
          sectionSubtitle={section?.subtitle}
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
