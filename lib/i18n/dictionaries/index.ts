/**
 * Dictionary Index
 *
 * Exports all locale dictionaries and provides a typed getter function.
 */

import type { Locale } from "../config";
import { enIE, type Dictionary } from "./en-IE";
import { hiIN } from "./hi-IN";
import { ptBR } from "./pt-BR";

const dictionaries: Record<Locale, Dictionary> = {
  "en-IE": enIE,
  "pt-BR": ptBR,
  "hi-IN": hiIN,
};

/**
 * Gets the dictionary for the specified locale.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary, Locale };
