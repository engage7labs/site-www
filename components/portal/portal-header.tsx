"use client";

import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";
import { LogOut, Menu, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PortalThemePicker } from "./portal-theme-picker";

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

  useEffect(() => {
    try {
      const cookies = document.cookie.split("; ");
      const sc = cookies.find((c) => c.startsWith(SESSION_COOKIE_NAME));
      if (!sc) return;
      const token = sc.split("=")[1];
      const parts = token.split(".");
      if (parts.length !== 3) return;
      const body = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      if (body.mode === "admin_view") setIsAdminView(true);
    } catch {
      /* ignore */
    }
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

      {/* Right: upload + theme picker + logout */}
      <div className="flex items-center gap-2">
        {!isAdminView && (
          <Link
            href="/portal/upload"
            className="flex items-center gap-1.5 rounded-lg bg-[#e6b800] px-3 py-1.5 text-sm font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-[#f2c94c] active:bg-[#c99a00]"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
        )}
        <PortalThemePicker />
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
