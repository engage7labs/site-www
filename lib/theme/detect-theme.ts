/**
 * Theme Detection
 *
 * Deterministic theme detection and persistence logic.
 */

import { DEFAULT_THEME, SUPPORTED_THEMES, type AppTheme } from "./config";

const THEME_STORAGE_KEY = "engage7-theme";

/**
 * Detects the user's theme preference from localStorage or browser preferences.
 *
 * Priority:
 * 1. Previously selected theme (localStorage)
 * 2. Browser color scheme preference
 * 3. Default theme (light)
 */
export function detectTheme(): AppTheme {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  // Check for previously stored theme
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && SUPPORTED_THEMES.includes(stored as AppTheme)) {
      return stored as AppTheme;
    }
  } catch (error) {
    // localStorage might be unavailable
    console.warn("Failed to access localStorage for theme:", error);
  }

  // Detect from browser color scheme preference
  if (window.matchMedia) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) {
      return "black";
    }
  }

  return DEFAULT_THEME;
}

/**
 * Persists the selected theme to localStorage.
 */
export function saveTheme(theme: AppTheme): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Failed to save theme to localStorage:", error);
  }
}
