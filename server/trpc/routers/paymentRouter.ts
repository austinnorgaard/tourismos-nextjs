import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { getDb } from "@/server/db";
import { offerings } from "@/server/../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { ENV } from "@/server/_core/env";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export const paymentRouter = router({
  /**
   * Create a Stripe Checkout session for an offering
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        offeringId: z.number(),
        quantity: z.number().min(1).default(1),
        customerEmail: z.string().email().optional(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get offering details
      const [offering] = await db
        .select()
        .from(offerings)
        .where(eq(offerings.id, input.offeringId))
        .limit(1);

      if (!offering) {
        throw new Error("Offering not found");
      }

      if (!offering.stripePriceId) {
        throw new Error("Offering does not have a Stripe Price configured");
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price: offering.stripePriceId,
            quantity: input.quantity,
          },
        ],
        customer_email: input.customerEmail,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          offeringId: offering.id.toString(),
          businessId: offering.businessId.toString(),
        },
        payment_intent_data: {
          metadata: {
            offeringId: offering.id.toString(),
            businessId: offering.businessId.toString(),
          },
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
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
});
