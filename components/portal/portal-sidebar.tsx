"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/shared/logo";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Moon,
  ScanSearch,
  Settings,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PortalSidebarItem } from "./portal-sidebar-item";

interface NavItem {
  key: "overview" | "reports" | "health" | "all" | "sleep" | "recovery" | "activity" | "insights" | "dataLab" | "sources" | "settings";
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", href: "/portal", icon: LayoutDashboard },
  { key: "insights", label: "Insights", href: "/portal/insights", icon: Lightbulb },
  {
    key: "health",
    label: "Health",
    href: "/portal/health",
    icon: Activity,
    children: [
      { key: "sleep", label: "Sleep", href: "/portal/health/sleep", icon: Moon },
      { key: "recovery", label: "Recovery", href: "/portal/health/recovery", icon: Heart },
      { key: "activity", label: "Activity", href: "/portal/health/activity", icon: Zap },
      { key: "all", label: "All", href: "/portal/health/all", icon: BarChart3 },
    ],
  },
  { key: "dataLab", label: "Data Lab", href: "/portal/trends", icon: TrendingUp },
  { key: "reports", label: "My Reports", href: "/portal/reports", icon: Upload },
  { key: "sources", label: "Sources", href: "/portal/sources", icon: ScanSearch },
];

const LOWER_NAV_ITEMS: NavItem[] = [
  { key: "settings", label: "Settings", href: "/portal/settings", icon: Settings },
];

const FLYOUT_CLOSE_DELAY_MS = 200;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/portal") return pathname === "/portal";
  return pathname.startsWith(href);
}

interface PortalSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function PortalSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: PortalSidebarProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [healthOpen, setHealthOpen] = useState(
    pathname.startsWith("/portal/health")
  );
  const [healthFlyoutOpen, setHealthFlyoutOpen] = useState(false);
  const healthFlyoutCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHealthFlyoutCloseTimer = useCallback(() => {
    if (healthFlyoutCloseTimerRef.current) {
      clearTimeout(healthFlyoutCloseTimerRef.current);
      healthFlyoutCloseTimerRef.current = null;
    }
  }, []);

  const openHealthFlyout = useCallback(() => {
    clearHealthFlyoutCloseTimer();
    setHealthFlyoutOpen(true);
  }, [clearHealthFlyoutCloseTimer]);

  const scheduleHealthFlyoutClose = useCallback(() => {
    clearHealthFlyoutCloseTimer();
    healthFlyoutCloseTimerRef.current = setTimeout(() => {
      setHealthFlyoutOpen(false);
      healthFlyoutCloseTimerRef.current = null;
    }, FLYOUT_CLOSE_DELAY_MS);
  }, [clearHealthFlyoutCloseTimer]);

  useEffect(() => {
    return () => {
      clearHealthFlyoutCloseTimer();
    };
  }, [clearHealthFlyoutCloseTimer]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand + collapse toggle */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {collapsed ? (
          // Collapsed: compact bully icon, centered
          <Link
            href="/portal"
            className="flex flex-1 items-center justify-center text-foreground"
            onClick={onCloseMobile}
          >
            <Logo size={28} compact className="rounded-lg shrink-0" />
          </Link>
        ) : (
          // Expanded: full horizontal logo only (no text)
          <Link
            href="/portal"
            className="flex items-center text-foreground"
            onClick={onCloseMobile}
          >
            <Logo size={36} className="shrink-0" />
          </Link>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => collapsed && openHealthFlyout()}
              onMouseLeave={() => collapsed && scheduleHealthFlyoutClose()}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget as Node | null;
                if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                  scheduleHealthFlyoutClose();
                }
              }}
            >
              <div
                className={`group flex w-full items-center rounded-2xl text-sm font-medium transition-all ${
                  isActivePath(pathname, item.href)
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  onFocus={() => collapsed && openHealthFlyout()}
                  aria-haspopup={collapsed ? "menu" : undefined}
                  aria-expanded={collapsed ? healthFlyoutOpen : undefined}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 flex-1 text-left ${
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                  >
                    {t.portal.shell.sections[item.key].title}
                  </span>
                </Link>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => setHealthOpen((prev) => !prev)}
                    aria-label={healthOpen ? "Collapse Health" : "Expand Health"}
                    aria-expanded={healthOpen}
                    className="mr-2 rounded-lg p-1.5 text-current transition-colors hover:bg-background/45"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                        healthOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
              {collapsed && healthFlyoutOpen && (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute left-full top-0 z-40 h-full w-3"
                  />
                  <div
                    role="menu"
                    aria-label={t.portal.shell.sections.health.title}
                    onMouseEnter={openHealthFlyout}
                    onMouseLeave={scheduleHealthFlyoutClose}
                    onFocus={openHealthFlyout}
                    className="absolute left-full top-0 z-50 ml-2 min-w-40 rounded-xl border border-border bg-card p-2 shadow-xl"
                  >
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          onClick={() => {
                            clearHealthFlyoutCloseTimer();
                            setHealthFlyoutOpen(false);
                            onCloseMobile();
                          }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                            childActive
                              ? "bg-accent/10 text-accent"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <child.icon className="h-3.5 w-3.5 shrink-0" />
                          {t.portal.shell.sections[child.key].title}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
              {/* Children: Sleep, Recovery, Activity, All */}
              {!collapsed && healthOpen && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border/50 pl-2">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          childActive
                            ? "bg-accent/10 text-accent"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <child.icon className="h-3.5 w-3.5 shrink-0" />
                        {t.portal.shell.sections[child.key].title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <PortalSidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={t.portal.shell.sections[item.key].title}
              active={isActivePath(pathname, item.href)}
              collapsed={collapsed}
              onClick={onCloseMobile}
            />
          )
        )}

        <div className="my-4 border-t border-border" />

        {LOWER_NAV_ITEMS.map((item) => (
          <PortalSidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={t.portal.shell.sections[item.key].title}
            active={isActivePath(pathname, item.href)}
            collapsed={collapsed}
            onClick={onCloseMobile}
          />
        ))}

        {/* Version — subtle, below Settings */}
        <span
          className={`mt-1 text-[10px] text-muted-foreground/40 transition-all duration-300 ${
            collapsed ? "text-center" : "px-3"
          }`}
        >
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "—"}
        </span>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex md:flex-col ${
          collapsed ? "md:w-20" : "md:w-72"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          {/* Panel */}
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
