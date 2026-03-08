/**
 * i18n Configuration
 *
 * Defines supported locales and locale mapping rules
 * for the Engage7 web application.
 */

export const SUPPORTED_LOCALES = ["en-IE", "pt-BR", "hi-IN"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-IE";

export const LOCALE_NAMES: Record<Locale, string> = {
  "en-IE": "English",
  "pt-BR": "Português",
  "hi-IN": "हिन्दी",
};

/**
 * Maps browser locale codes to supported application locales.
 *
 * Mapping rules:
 * - en-IE, en-GB, en-US, en => en-IE
 * - pt-BR, pt-PT, pt => pt-BR
 * - hi-IN, hi => hi-IN
 * - anything else => en-IE
 */
export function mapLocale(browserLocale: string): Locale {
  const normalized = browserLocale.toLowerCase();

  // English variants
  if (normalized.startsWith("en")) {
    return "en-IE";
  }

  // Portuguese variants
  if (normalized.startsWith("pt")) {
    return "pt-BR";
  }

  // Hindi variants
  if (normalized.startsWith("hi")) {
    return "hi-IN";
  }

  // Default fallback
  return DEFAULT_LOCALE;
}
