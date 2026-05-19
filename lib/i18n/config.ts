/**
 * i18n Configuration
 *
 * Defines supported locales and locale mapping rules
 * for the Engage7 web application.
 */

export const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type RuntimeLocale = "en-IE" | "pt-BR" | "hi-IN";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português",
};

/**
 * Maps browser locale codes to supported application locales.
 *
 * Mapping rules:
 * - en-IE, en-GB, en-US, en => en
 * - pt-BR, pt-PT, pt => pt-BR
 * - anything else => en
 */
export function mapLocale(browserLocale: string): Locale {
  const normalized = browserLocale.toLowerCase();

  // English variants
  if (normalized.startsWith("en")) {
    return "en";
  }

  // Portuguese variants
  if (normalized.startsWith("pt")) {
    return "pt-BR";
  }

  // Default fallback
  return DEFAULT_LOCALE;
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  if (value === "en" || value === "en-IE") return "en";
  if (value === "pt-BR") return "pt-BR";
  return mapLocale(value);
}

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "pt-BR";
}

export function toRuntimeLocale(locale: string | null | undefined): RuntimeLocale {
  return normalizeLocale(locale) === "pt-BR" ? "pt-BR" : "en-IE";
}
