/**
 * Stripe server-side client — Sprint 33.0
 *
 * Lazy singleton. Only instantiated when env vars are present.
 * Safe to import in API routes; throws on first use if unconfigured.
 *
 * Required env vars (set in Vercel):
 *   STRIPE_SECRET_KEY         — Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET     — Stripe webhook signing secret (whsec_...)
 *   STRIPE_PRICE_ID           — Stripe Price ID for €7/month (price_...)
 *   NEXT_PUBLIC_APP_URL       — Base URL for redirect after payment
 */

import Stripe from "stripe";
import { resolveCanonicalAppUrl } from "@/lib/canonical-app-url";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("[stripe] STRIPE_SECRET_KEY not configured");
  _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  return _stripe;
}

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const APP_URL = resolveCanonicalAppUrl().appUrl;
