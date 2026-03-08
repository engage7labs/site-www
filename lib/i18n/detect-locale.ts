/**
 * Locale Detection
 *
 * Deterministic locale detection and persistence logic.
 */

import {
  DEFAULT_LOCALE,
  mapLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "./config";

const LOCALE_STORAGE_KEY = "engage7-locale";

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
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (error) {
    // localStorage might be unavailable
    console.warn("Failed to access localStorage for locale:", error);
  }

  // Detect from browser
  const browserLocale = navigator.language || navigator.languages?.[0];
  if (browserLocale) {
    return mapLocale(browserLocale);
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
  } catch (error) {
    console.warn("Failed to save locale to localStorage:", error);
  }
}
