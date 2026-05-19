/**
 * Dictionary Index
 *
 * Exports all locale dictionaries and provides a typed getter function.
 */

import { toRuntimeLocale, type Locale, type RuntimeLocale } from "../config";
import { enIE, type Dictionary } from "./en-IE";
import { hiIN } from "./hi-IN";
import { ptBR } from "./pt-BR";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

const dictionaries: Record<RuntimeLocale, DeepPartial<Dictionary>> = {
  "en-IE": enIE,
  "pt-BR": ptBR,
  "hi-IN": hiIN,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeWithEnglishFallback<T>(fallback: T, override: DeepPartial<T>): T {
  if (!isPlainObject(fallback) || !isPlainObject(override)) {
    return (override ?? fallback) as T;
  }

  const merged: Record<string, unknown> = { ...fallback };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = (fallback as Record<string, unknown>)[key];
    merged[key] =
      isPlainObject(baseValue) && isPlainObject(value)
        ? mergeWithEnglishFallback(baseValue, value)
        : value ?? baseValue;
  }
  return merged as T;
}

/**
 * Gets the dictionary for the specified locale.
 */
export function getDictionary(locale: Locale): Dictionary {
  const runtimeLocale = toRuntimeLocale(locale);
  if (runtimeLocale === "en-IE") return enIE;
  return mergeWithEnglishFallback(enIE, dictionaries[runtimeLocale]);
}

export type { DeepPartial, Dictionary, Locale };
