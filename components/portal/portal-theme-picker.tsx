"use client";

import { useAppTheme } from "@/components/providers/app-theme-provider";
import {
  SUPPORTED_THEMES,
  THEME_NAMES,
  THEME_SWATCHES,
  type AppTheme,
} from "@/lib/theme";
import { useCallback, useEffect, useRef, useState } from "react";

export function PortalThemePicker() {
  const { appTheme, setAppTheme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        aria-label="Change theme"
        title="Change theme"
      >
        <span
          className="block h-4 w-4 rounded-full border border-border/50"
          style={{ backgroundColor: THEME_SWATCHES[appTheme] }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 flex gap-1.5 rounded-lg border border-border bg-card p-2 shadow-lg">
          {SUPPORTED_THEMES.map((t: AppTheme) => (
            <button
              key={t}
              onClick={() => {
                setAppTheme(t);
                close();
              }}
              className={`group relative flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                appTheme === t
                  ? "border-accent ring-2 ring-accent shadow-[0_0_6px_rgba(16,185,129,0.45)]"
                  : "border-border/50 hover:border-foreground/30"
              }`}
              title={THEME_NAMES[t]}
              aria-label={THEME_NAMES[t]}
            >
              <span
                className="block h-4 w-4 rounded-full"
                style={{ backgroundColor: THEME_SWATCHES[t] }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
