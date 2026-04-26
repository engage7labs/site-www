/**
 * POST /api/stripe/checkout — Sprint 33.0
 *
 * Creates a Stripe Checkout Session for the €7/month Premium plan.
 * Requires authenticated session (JWT cookie).
 *
 * Returns: { url: string } — redirect to Stripe-hosted checkout.
 */

import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { APP_URL, getStripe, STRIPE_PRICE_ID } from "@/lib/stripe";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Auth
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = verifyJwt(token);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check Stripe is configured
  if (!STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: "Billing not configured" },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: session.sub,
      metadata: { email: session.sub },
      success_url: `${APP_URL}/portal/settings?payment=success`,
      cancel_url: `${APP_URL}/portal/settings?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "en",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
