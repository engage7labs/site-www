"use client";

import { useAppTheme } from "@/components/providers/app-theme-provider";
import { LogOut, Menu, Moon, Sun, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PortalHeaderProps {
  onToggleMobile: () => void;
}

export function PortalHeader({ onToggleMobile }: PortalHeaderProps) {
  const router = useRouter();
  const { appTheme, setAppTheme } = useAppTheme();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const toggleTheme = () => {
    setAppTheme(appTheme === "light" ? "black" : "light");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      {/* Left: mobile menu + branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-foreground">Engage7</span>
      </div>

      {/* Right: upload + theme + logout */}
      <div className="flex items-center gap-2">
        <Link
          href="/analyze"
          className="flex items-center gap-1.5 rounded-lg bg-[#e6b800] px-3 py-1.5 text-sm font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-[#f2c94c] active:bg-[#c99a00]"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {appTheme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>
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
