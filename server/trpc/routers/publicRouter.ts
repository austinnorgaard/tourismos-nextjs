import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { getDb } from "@/server/db";
import { businesses, offerings, bookings } from "@/server/../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Public API router for standalone booking applications
 * These endpoints are designed to be called from custom domains
 * with CORS enabled for cross-origin requests
 */
export const publicRouter = router({
  /**
   * Get business information by business ID
   * Used to fetch branding, contact info, and settings for a specific business
   */
  getBusiness: publicProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, input.businessId))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Business not found");
      }

      return result[0];
    }),

  /**
   * Get all active offerings for a business
   * Used to display available tours/activities on the public booking page
   */
  getOfferings: publicProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(offerings)
        .where(
          and(
            eq(offerings.businessId, input.businessId),
            eq(offerings.active, true)
          )
        );

      return result;
    }),

  /**
   * Get a single offering by ID
   * Used to display detailed information on the booking page
   */
  getOffering: publicProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(offerings)
        .where(
          and(
            eq(offerings.id, input.offeringId),
            eq(offerings.active, true)
          )
        )
        .limit(1);

      if (result.length === 0) {
        throw new Error("Offering not found");
      }

      return result[0];
    }),

  /**
   * Create a new booking
   * Used when customers submit booking requests from the public site
   */
  createBooking: publicProcedure
    .input(
      z.object({
        businessId: z.number(),
        offeringId: z.number(),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        bookingDate: z.string(), // ISO date string
        bookingTime: z.string().optional(),
        partySize: z.number().min(1),
        notes: z.string().optional(),
        totalAmount: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the offering exists and belongs to the business
      const offering = await db
        .select()
        .from(offerings)
        .where(
          and(
            eq(offerings.id, input.offeringId),
            eq(offerings.businessId, input.businessId),
            eq(offerings.active, true)
          )
        )
        .limit(1);

      if (offering.length === 0) {
        throw new Error("Offering not found or not available");
      }

      // Create the booking
      const result = await db.insert(bookings).values({
        businessId: input.businessId,
        offeringId: input.offeringId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || null,
        bookingDate: new Date(input.bookingDate),
        bookingTime: input.bookingTime || null,
        partySize: input.partySize,
        notes: input.notes || null,
        totalAmount: input.totalAmount,
        status: "pending",
        paymentStatus: "pending",
      });

      // Get the last inserted ID
      const [lastInsert] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .orderBy(bookings.id)
        .limit(1);

      return {
        success: true,
        bookingId: lastInsert?.id || 0,
        message: "Booking created successfully",
      };
    }),
});
