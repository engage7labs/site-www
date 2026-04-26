/**
 * POST /api/stripe/webhook — Sprint 33.0
 *
 * Handles Stripe webhook events. Verifies signature with STRIPE_WEBHOOK_SECRET.
 * On checkout.session.completed → upgrades user plan to "premium" via API backend.
 *
 * Register this URL in Stripe Dashboard → Webhooks:
 *   https://engage7.ie/api/stripe/webhook
 * Events: checkout.session.completed, customer.subscription.deleted
 */

import { signRequest } from "@/lib/api/signing";
import { INTERNAL_API_BASE_URL } from "@/lib/server-config";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Stripe requires the raw body for signature verification
export const dynamic = "force-dynamic";

async function upgradePlan(email: string, plan: string, stripeCustomerId?: string) {
  const path = "/api/users/upgrade-plan";
  const sigHeaders = signRequest("POST", path);
  try {
    const res = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...sigHeaders },
      body: JSON.stringify({ email, plan, stripe_customer_id: stripeCustomerId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[stripe/webhook] upgrade-plan ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] upgrade-plan fetch failed:", err);
  }
}

export async function POST(request: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email =
        (session.metadata?.email as string | undefined) ??
        session.customer_email;
      if (!email) {
        console.error("[stripe/webhook] No email in checkout session");
        break;
      }
      const customerId =
        typeof session.customer === "string" ? session.customer : undefined;
      await upgradePlan(email, "premium", customerId);
      console.log(`[stripe/webhook] checkout.session.completed: ${email} → premium`);
      break;
    }

    case "customer.subscription.deleted": {
      // Subscription cancelled — revert to expired
      const sub = event.data.object as Stripe.Subscription;
      const custId =
        typeof sub.customer === "string" ? sub.customer : undefined;
      if (custId) {
        // Look up email from Stripe customer (best-effort)
        try {
          const stripe = getStripe();
          const customer = await stripe.customers.retrieve(custId);
          if (!customer.deleted && "email" in customer && customer.email) {
            await upgradePlan(customer.email, "expired", custId);
            console.log(`[stripe/webhook] subscription.deleted: ${customer.email} → expired`);
          }
        } catch (err) {
          console.error("[stripe/webhook] customer lookup failed:", err);
        }
      }
      break;
    }

    default:
      // Ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
