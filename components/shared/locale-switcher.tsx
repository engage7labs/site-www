/**
 * Locale Switcher Component
 *
 * Allows users to switch between supported locales.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_NAMES, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { Check, Languages } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const HOVER_CLOSE_DELAY_MS = 150;

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onFocus={openMenu}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => {
              setLocale(loc);
              setOpen(false);
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{LOCALE_NAMES[loc]}</span>
            {locale === loc && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
