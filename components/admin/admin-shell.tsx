"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { PortalSidebarItem } from "@/components/portal/portal-sidebar-item";
import { useSessionSafetyGuard } from "@/lib/auth-session-client";
import {
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Files,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelRightOpen,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLogoutButton } from "./admin-logout-button";

const STORAGE_KEY = "engage7_admin_sidebar_collapsed";
const ADMIN_ENV_LABEL = process.env.NEXT_PUBLIC_ADMIN_ENV_LABEL?.trim();

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/features", label: "Features", icon: SlidersHorizontal },
  { href: "/admin/ai-artifacts", label: "AI Artifacts", icon: Sparkles },
  { href: "/admin/blobs", label: "Blob Storage", icon: Files },
  { href: "/admin/acr", label: "ACR", icon: Boxes },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function AdminPortalLabel({ compact = false }: Readonly<{ compact?: boolean }>) {
  const { locale } = useLocale();
  const label = locale === "pt-BR" ? "Portal Admin" : "Admin Portal";

  return (
    <div className="min-w-0">
      <span
        className={`block truncate font-semibold leading-tight text-foreground ${
          compact ? "text-base" : "text-lg"
        }`}
      >
        {label}
      </span>
      <span className="block text-xs leading-tight text-muted-foreground">
        Engage7 Labs
      </span>
    </div>
  );
}

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {collapsed ? (
          <Link
            href="/admin"
            className="flex flex-1 items-center justify-center text-foreground"
            onClick={onCloseMobile}
          >
            <Logo size={28} compact className="shrink-0 rounded-lg" />
          </Link>
        ) : (
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3 text-foreground"
            onClick={onCloseMobile}
          >
            <Logo size={36} className="shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Engage7
              </span>
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Admin
              </span>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex flex-1 flex-col gap-1 px-3 py-4"
      >
        {ADMIN_NAV_ITEMS.map((item) => (
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

        <PortalSidebarItem
          href="/portal"
          icon={PanelRightOpen}
          label="Portal"
          active={false}
          collapsed={collapsed}
          onClick={onCloseMobile}
        />
        <AdminLogoutButton collapsed={collapsed} onLogout={onCloseMobile} />

        <span
          className={`mt-1 text-[10px] text-muted-foreground/40 transition-all duration-300 ${
            collapsed ? "text-center" : "px-3"
          }`}
        >
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.50.9.1"}
        </span>
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex md:flex-col ${
          collapsed ? "md:w-20" : "md:w-72"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <button
              type="button"
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

interface AdminHeaderProps {
  onToggleMobile: () => void;
  sectionTitle: string;
}

function AdminEnvironmentBadge() {
  if (!ADMIN_ENV_LABEL) return null;

  return (
    <div className="inline-flex items-center rounded-full border border-border/80 bg-muted/40 px-2 py-1 text-[11px] font-medium leading-none text-muted-foreground">
      {ADMIN_ENV_LABEL}
    </div>
  );
}

function AdminHeader({ onToggleMobile, sectionTitle }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:block">
          <AdminPortalLabel />
          <span className="text-xs leading-tight text-muted-foreground">
            {sectionTitle}
          </span>
        </div>
        <div className="md:hidden">
          <AdminPortalLabel compact />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <AdminEnvironmentBadge />
        <div className="hidden items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 sm:flex">
          <Boxes className="h-3.5 w-3.5" />
          Admin
        </div>
        <ThemeSwitcher />
        <LocaleSwitcher />
        <AdminLogoutButton variant="header" />
      </div>
    </header>
  );
}

export function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const sessionGuard = useSessionSafetyGuard({
    loginPath: "/login?admin=1",
    requiredRole: "admin",
  });

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

  const sectionTitle = useMemo(() => {
    return (
      ADMIN_NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ??
      "Admin"
    );
  }, [pathname]);

  if (!sessionGuard.ready) {
    return (
      <div className="portal-surface flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {sessionGuard.status === "refreshing" ? "Redirecting..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="portal-surface flex min-h-screen text-foreground">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          sectionTitle={sectionTitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
