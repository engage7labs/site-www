"use client";

import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { LogOut, Menu, Upload, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PortalHeaderProps {
  onToggleMobile: () => void;
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export function PortalHeader({
  onToggleMobile,
  sectionTitle,
  sectionSubtitle,
}: PortalHeaderProps) {
  const router = useRouter();
  const [isAdminView, setIsAdminView] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (session: {
          email?: string;
          mode?: "admin_view";
          view_as_user_id?: string;
        } | null) => {
          if (!session) return;
          setUserEmail(session.email ?? null);
          setIsAdminView(session.mode === "admin_view");
          setViewAsUserId(session.view_as_user_id ?? null);
        }
      )
      .catch(() => {
        /* Header identity is best-effort; auth gates still run server-side. */
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      {/* Left: mobile menu + section title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-foreground md:hidden">
          Engage7
        </span>
        {sectionTitle && (
          <div className="hidden md:flex md:flex-col md:gap-0.5">
            <span className="text-lg font-semibold leading-tight text-foreground">
              {sectionTitle}
            </span>
            {sectionSubtitle && (
              <span className="text-xs leading-tight text-muted-foreground">
                {sectionSubtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: upload + theme + language + logout */}
      <div className="flex items-center gap-1.5">
        {userEmail && (
          <div
            className="hidden max-w-[220px] items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground lg:flex"
            title={
              isAdminView
                ? `Admin view: ${userEmail}${viewAsUserId ? ` (${viewAsUserId})` : ""}`
                : userEmail
            }
          >
            <UserRound className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {isAdminView ? `Viewing ${userEmail}` : userEmail}
            </span>
            {isAdminView && (
              <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                read-only
              </span>
            )}
          </div>
        )}
        {!isAdminView && (
          <Link
            href="/portal/upload"
            className="flex items-center gap-1.5 rounded-lg bg-[#e6b800] px-3 py-1.5 text-sm font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-[#f2c94c] active:bg-[#c99a00]"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
        )}
        <ThemeSwitcher />
        <LocaleSwitcher />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
