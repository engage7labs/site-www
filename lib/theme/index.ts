/**
 * Theme Module
 *
 * Exports all theme utilities.
 */

export {
  DEFAULT_THEME,
  SUPPORTED_THEMES,
  THEME_NAMES,
  cssClassToTheme,
  themeToCSSClass,
  type AppTheme,
} from "./config";
export { detectTheme, saveTheme } from "./detect-theme";
