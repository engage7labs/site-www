"use client";

import { clearPublicClaimClientState } from "@/lib/public-analysis-claim";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    clearPublicClaimClientState();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login?admin=1");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Logout</span>
    </button>
  );
}
