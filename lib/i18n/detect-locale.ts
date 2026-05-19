/**
 * Locale Detection
 *
 * Deterministic locale detection and persistence logic.
 */

import {
  DEFAULT_LOCALE,
  normalizeLocale,
  mapLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "./config";

export const LOCALE_STORAGE_KEY = "engage7-locale";
export const LOCALE_COOKIE_KEY = "engage7_locale";

/**
 * Detects the user's locale from localStorage or browser preferences.
 *
 * Priority:
 * 1. Previously selected locale (localStorage)
 * 2. Browser locale (navigator.language)
 * 3. Default locale (en-IE)
 */
export function detectLocale(): Locale {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  // Check for previously stored locale
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeLocale(stored);
      if (SUPPORTED_LOCALES.includes(normalized)) {
        return normalized;
      }
    }
  } catch (error) {
    // localStorage might be unavailable
    console.warn("Failed to access localStorage for locale:", error);
  }

  // Detect from browser
  const browserLocales =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language].filter(Boolean);
  for (const browserLocale of browserLocales) {
    const mapped = mapLocale(browserLocale);
    if (SUPPORTED_LOCALES.includes(mapped)) {
      return mapped;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Persists the selected locale to localStorage.
 */
export function saveLocale(locale: Locale): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(
      locale
    )}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch (error) {
    console.warn("Failed to save locale to localStorage:", error);
  }
}
