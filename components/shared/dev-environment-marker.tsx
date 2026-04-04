"use client";

import { environmentLabel, isDevEnvironment } from "@/lib/env";

/**
 * Fixed-position DEV environment badge.
 * Renders only when NEXT_PUBLIC_APP_ENV is "dev" or "development".
 * Placed in the root layout so it appears on every page.
 */
export function DevEnvironmentMarker() {
  if (!isDevEnvironment) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-50/90 px-2.5 py-1 shadow-sm backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/80"
      title="Development environment — not production"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      <span className="text-[11px] font-semibold tracking-wide text-amber-700 dark:text-amber-400">
        {environmentLabel}
      </span>
      <span className="hidden sm:inline text-[9px] text-amber-600/70 dark:text-amber-500/60">
        Development environment
      </span>
    </div>
  );
}
