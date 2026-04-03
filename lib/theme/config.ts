/**
 * Theme Configuration
 *
 * Defines supported themes for the Engage7 web application.
 *
 * Note: All dark variants map to CSS "dark" class with an additional
 * data-theme attribute for variant-specific overrides.
 */

export const SUPPORTED_THEMES = [
  "light",
  "black",
  "dark-blue",
  "dark-red",
  "dark-gold",
] as const;
export type AppTheme = (typeof SUPPORTED_THEMES)[number];

export const DEFAULT_THEME: AppTheme = "light";

export const THEME_NAMES: Record<AppTheme, string> = {
  light: "Light",
  black: "Emerald Black",
  "dark-blue": "Deep Blue",
  "dark-red": "Dark Red",
  "dark-gold": "Dark Gold",
};

/** Swatch colors for the theme picker UI */
export const THEME_SWATCHES: Record<AppTheme, string> = {
  light: "#ffffff",
  black: "#0a0f0d",
  "dark-blue": "#0a0d14",
  "dark-red": "#140a0a",
  "dark-gold": "#14110a",
};

/**
 * Maps product theme to CSS theme class.
 *
 * All dark variants use the "dark" CSS class.
 */
export function themeToCSSClass(theme: AppTheme): string {
  return theme === "light" ? "light" : "dark";
}

/**
 * Maps CSS theme class back to product theme.
 * Returns "black" as default dark theme; use stored preference for specificity.
 */
export function cssClassToTheme(cssClass: string): AppTheme {
  return cssClass === "dark" ? "black" : "light";
}
