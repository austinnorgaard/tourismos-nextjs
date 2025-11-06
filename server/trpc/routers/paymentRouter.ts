import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "@/server/trpc";
import * as db from "@/server/db";
import Stripe from "stripe";
import { ENV } from "@/server/_core/env";
import { SUBSCRIPTION_PRODUCTS } from "@/server/products";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

function getOriginFromCtx(ctx: { req?: unknown }): string {
  const req = ctx.req as { headers?: Record<string, unknown> } | undefined;
  const origin = req?.headers?.origin;
  return typeof origin === 'string' ? origin : '';
}

export const paymentRouter = router({
  /**
   * Create a Stripe Checkout session. Accepts either a subscription 'tier' or
   * an offering checkout payload. We accept a union input and branch at
   * runtime so frontend code calling `trpc.payment.createCheckoutSession` works
   * for both use-cases.
   */
  createCheckoutSession: publicProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      // Subscription flow
      if (input && (input as unknown as Record<string, unknown>).tier) {
        const tier = (input as unknown as Record<string, unknown>).tier as "starter" | "professional" | "enterprise";
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        const product = SUBSCRIPTION_PRODUCTS[tier];

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            business_id: business?.id?.toString?.() || "",
            tier,
          },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: product.name,
                  description: product.description,
                },
                unit_amount: product.price,
                recurring: {
                  interval: product.interval,
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${getOriginFromCtx(ctx)}/settings?payment=success`,
          cancel_url: `${getOriginFromCtx(ctx)}/settings?payment=cancelled`,
          allow_promotion_codes: true,
        });

        return { url: session.url };
      }


      // Offering checkout flow
      const data = input as {
        offeringId: number;
        quantity?: number;
        customerEmail?: string;
        successUrl: string;
        cancelUrl: string;
      };

      const offering = await db.getOfferingById(data.offeringId);

      if (!offering) throw new Error("Offering not found");
      if (!offering.stripePriceId) throw new Error("Offering does not have a Stripe Price configured");

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          { price: offering.stripePriceId, quantity: data.quantity ?? 1 },
        ],
        customer_email: data.customerEmail,
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          offeringId: offering.id.toString(),
          businessId: offering.businessId.toString(),
        },
      });

      return { sessionId: session.id, url: session.url };
    }),

  /**
   * Verify payment status
   */
  verifyPayment: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);

      return {
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      };
    }),
  
  getConnectAccountStatus: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business || !business.stripeAccountId) return { connected: false };

    try {
      const account = await stripe.accounts.retrieve(business.stripeAccountId);
      const isComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;

      if (isComplete && !business.stripeOnboardingComplete) {
        await db.updateBusiness(business.id, {
          stripeAccountStatus: "active",
          stripeOnboardingComplete: 1,
        });
      }

      return {
        connected: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: isComplete,
      };
    } catch (_e) {
      console.debug('Stripe account retrieval failed', _e);
      return { connected: false, error: "Failed to retrieve account" } as unknown as { connected: boolean; error?: string };
    }
  }),

  createConnectAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });

    const account = await stripe.accounts.create({
      type: "express",
      email: ctx.user.email || undefined,
      business_type: "company",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        business_id: business.id.toString(),
        user_id: ctx.user.id.toString(),
      },
    });

    await db.updateBusiness(business.id, {
      stripeAccountId: account.id,
      stripeAccountStatus: "pending",
      stripeOnboardingComplete: 0,
    });

    return { accountId: account.id };
  }),

  createConnectAccountLink: protectedProcedure.mutation(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business || !business.stripeAccountId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe account found" });

    const accountLink = await stripe.accountLinks.create({
      account: business.stripeAccountId,
  refresh_url: `${getOriginFromCtx(ctx)}/settings?stripe=refresh`,
  return_url: `${getOriginFromCtx(ctx)}/settings?stripe=success`,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  }),

  disconnectAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business || !business.stripeAccountId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe account found" });

    await stripe.accounts.del(business.stripeAccountId);

    await db.updateBusiness(business.id, {
      stripeAccountId: null,
      stripeAccountStatus: null,
      stripeOnboardingComplete: 0,
    });

    return { success: true };
  }),

});
