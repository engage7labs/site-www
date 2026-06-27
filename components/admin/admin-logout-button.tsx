"use client";

import { clearPublicClaimClientState } from "@/lib/public-analysis-claim";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminLogoutButtonProps {
  collapsed?: boolean;
  onLogout?: () => void;
  variant?: "sidebar" | "header";
}

export function AdminLogoutButton({
  collapsed = false,
  onLogout,
  variant = "sidebar",
}: AdminLogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    clearPublicClaimClientState();
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout?.();
    router.push("/login?admin=1");
    router.refresh();
  };

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        Logout
      </span>
    </button>
  );
}
