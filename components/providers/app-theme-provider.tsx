/**
 * App Theme Provider
 *
 * Wraps next-themes ThemeProvider with Engage7 product theme semantics.
 * Maps product theme "black" to CSS "dark" implementation.
 */

"use client";

import { AppTheme, DEFAULT_THEME, themeToCSSClass } from "@/lib/theme";
import { detectTheme, saveTheme } from "@/lib/theme/detect-theme";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface AppThemeContextValue {
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(
  undefined
);

interface AppThemeProviderProps {
  readonly children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [appTheme, setAppThemeState] = useState<AppTheme>(DEFAULT_THEME);
  const [cssTheme, setCssTheme] = useState<string>(
    themeToCSSClass(DEFAULT_THEME)
  );
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const detectedTheme = detectTheme();
    setAppThemeState(detectedTheme);
    setCssTheme(themeToCSSClass(detectedTheme));
    document.documentElement.setAttribute("data-theme", detectedTheme);
    setMounted(true);
  }, []);

  const setAppTheme = (newTheme: AppTheme) => {
    setAppThemeState(newTheme);
    setCssTheme(themeToCSSClass(newTheme));
    saveTheme(newTheme);
    // Set data-theme for variant-specific CSS overrides
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AppThemeContext.Provider value={{ appTheme, setAppTheme }}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={cssTheme}
        forcedTheme={cssTheme}
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </AppThemeContext.Provider>
  );
}

/**
 * Hook to access app theme context.
 * Must be used within AppThemeProvider.
 */
export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
