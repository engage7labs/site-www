/**
 * Locale Provider
 *
 * Provides locale context and switching functionality throughout the app.
 */

"use client";

import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { detectLocale, saveLocale } from "@/lib/i18n/detect-locale";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import React, { createContext, useContext, useEffect, useState } from "react";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  readonly children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [dictionary, setDictionary] = useState<Dictionary>(
    getDictionary(DEFAULT_LOCALE)
  );
  const [mounted, setMounted] = useState(false);

  // Initialize locale on mount
  useEffect(() => {
    const detectedLocale = detectLocale();
    setLocaleState(detectedLocale);
    setDictionary(getDictionary(detectedLocale));
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setDictionary(getDictionary(newLocale));
    saveLocale(newLocale);

    // Update html lang attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionary }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to access locale context.
 * Must be used within LocaleProvider.
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
