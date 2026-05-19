/**
 * i18n Module
 *
 * Exports all internationalization utilities.
 */

export {
  DEFAULT_LOCALE,
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  mapLocale,
  normalizeLocale,
  toRuntimeLocale,
  type Locale,
  type RuntimeLocale,
} from "./config";
export { detectLocale, saveLocale } from "./detect-locale";
export { getDictionary, type Dictionary } from "./dictionaries";
