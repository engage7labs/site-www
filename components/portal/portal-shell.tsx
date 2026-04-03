"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminViewBanner } from "../admin-view-banner";
import { PasswordSetupAlert } from "./password-setup-alert";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/portal": {
    title: "Overview",
    subtitle: "Your health data at a glance",
  },
  "/portal/reports": {
    title: "My Uploads",
    subtitle: "Review your generated health reports",
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
    title: "Upload",
    subtitle: "Upload your Apple Health export",
  },
  "/portal/health": {
    title: "Health",
    subtitle: "Longitudinal Sleep, Recovery & Activity",
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
