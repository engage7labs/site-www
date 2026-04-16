/**
 * Insight Contract — Sprint 25.1
 *
 * Hard validation rules for the Insight type.
 * An insight that violates any rule is dropped from output.
 *
 * Rules:
 *  1. action must not contain generic hedging verbs
 *  2. evidence must contain at least one number
 *  3. insight must not be identical to action (restatement check)
 *
 * Generic verbs banned: "improve", "optimize", "enhance", "try to", "consider"
 * These produce safe, interchangeable outputs that apply to any user.
 */

import type { Insight } from "./engine";

const GENERIC_VERBS = [
  "improve",
  "optimize",
  "enhance",
  "try to",
  "consider",
] as const;

function containsGenericVerb(text: string): boolean {
  const lower = text.toLowerCase();
  return GENERIC_VERBS.some((v) => lower.includes(v));
}

function containsNumber(text: string): boolean {
  return /\d/.test(text);
}

/**
 * Returns true if the insight satisfies the contract.
 * Returns false if the insight is invalid and must be dropped.
 */
export function validateInsight(insight: Insight): boolean {
  // Rule 1: action must not hedge
  if (containsGenericVerb(insight.action)) return false;

  // Rule 2: evidence must be data-grounded (contains a number)
  if (!containsNumber(insight.evidence)) return false;

  // Rule 3: insight must not restate action verbatim
  if (insight.insight.trim() === insight.action.trim()) return false;

  return true;
}
