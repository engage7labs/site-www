/**
 * Theme Configuration
 *
 * Defines supported themes for the Engage7 web application.
 *
 * Note: Product theme "black" maps to CSS "dark" mode implementation.
 */

export const SUPPORTED_THEMES = ["light", "black"] as const;
export type AppTheme = (typeof SUPPORTED_THEMES)[number];

export const DEFAULT_THEME: AppTheme = "light";

export const THEME_NAMES: Record<AppTheme, string> = {
  light: "Light",
  black: "Black",
};

/**
 * Maps product theme to CSS theme class.
 *
 * Product theme "black" uses the existing "dark" CSS implementation.
 */
export function themeToCSSClass(theme: AppTheme): string {
  return theme === "black" ? "dark" : theme;
}

/**
 * Maps CSS theme class back to product theme.
 */
export function cssClassToTheme(cssClass: string): AppTheme {
  return cssClass === "dark" ? "black" : "light";
}
