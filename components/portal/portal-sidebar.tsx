"use client";

import { Logo } from "@/components/shared/logo";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Moon,
  Settings,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PortalSidebarItem } from "./portal-sidebar-item";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/portal", icon: LayoutDashboard },
  { label: "My Uploads", href: "/portal/reports", icon: Upload },
  { label: "Trends", href: "/portal/trends", icon: TrendingUp },
  {
    label: "Health",
    href: "/portal/health",
    icon: Activity,
    children: [
      { label: "Sleep", href: "/portal/health#sleep", icon: Moon },
      { label: "Recovery", href: "/portal/health#recovery", icon: Heart },
      { label: "Activity", href: "/portal/health#activity", icon: Zap },
    ],
  },
  { label: "Insights", href: "/portal/insights", icon: Lightbulb },
];

const LOWER_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: "/portal/settings", icon: Settings },
];

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
  const pathname = usePathname();
  const [healthOpen, setHealthOpen] = useState(
    pathname.startsWith("/portal/health")
  );

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
            <div key={item.href}>
              {/* Parent: Health with toggle */}
              <button
                type="button"
                onClick={() => {
                  if (collapsed) {
                    // When collapsed, just navigate
                    window.location.href = item.href;
                    onCloseMobile();
                  } else {
                    setHealthOpen((prev) => !prev);
                  }
                }}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActivePath(pathname, item.href)
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 flex-1 text-left ${
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  {item.label}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                      healthOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {/* Children: Sleep, Recovery, Activity */}
              {!collapsed && healthOpen && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border/50 pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onCloseMobile}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <child.icon className="h-3.5 w-3.5 shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <PortalSidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
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
            label={item.label}
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
