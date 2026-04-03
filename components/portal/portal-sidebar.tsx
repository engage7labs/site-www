"use client";

import { Logo } from "@/components/shared/logo";
import {
  LayoutDashboard,
  Lightbulb,
  PanelLeft,
  PanelLeftClose,
  Settings,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalSidebarItem } from "./portal-sidebar-item";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/portal", icon: LayoutDashboard },
  { label: "My Uploads", href: "/portal/reports", icon: Upload },
  { label: "Trends", href: "/portal/trends", icon: TrendingUp },
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Link
          href="/portal"
          className="flex items-center gap-2 text-foreground"
          onClick={onCloseMobile}
        >
          <Logo size={32} className="rounded-lg shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap font-semibold transition-all duration-300 ${
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            Engage7
          </span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
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

      {/* Collapse toggle — Pipeboard-style bottom rail */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeft className="h-4 w-4 shrink-0" />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 shrink-0" />
            <span className="text-xs">Collapse</span>
          </>
        )}
      </button>
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
