/**
 * AdminViewBanner — Visual indicator that admin is viewing as user (read-only)
 *
 * Sprint 17.1: Portal Observability
 * Displayed when mode === "admin_view"
 */

"use client";

import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionPayload {
  sub: string;
  role: "user" | "admin";
  mode?: "admin_view";
  read_only?: boolean;
  view_as_user_id?: string;
}

function parseJwt(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const body = parts[1];
    const decoded = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as SessionPayload;
  } catch {
    return null;
  }
}

export function AdminViewBanner() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: SessionPayload | null) => setSession(payload))
      .catch(() => {
        const cookies = document.cookie.split("; ");
        const sessionCookie = cookies.find((c) =>
          c.startsWith(SESSION_COOKIE_NAME)
        );
        if (!sessionCookie) return;
        setSession(parseJwt(sessionCookie.split("=")[1]));
      });
  }, []);

  if (!session || session.mode !== "admin_view" || dismissed) {
    return null;
  }

  const handleExit = () => {
    // Redirect to exit-view endpoint
    window.location.href = "/admin/exit-view";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm supports-[backdrop-filter]:bg-amber-500/5">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            Viewing as {session.sub}
            {session.view_as_user_id ? ` (${session.view_as_user_id})` : ""} —
            read-only mode
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded transition-colors"
          >
            Exit
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
