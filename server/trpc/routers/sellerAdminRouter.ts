import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import * as sellerAdminDb from "@/server/sellerAdminDb";

/**
 * Middleware to check if user is a seller admin
 */
const sellerAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "seller_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only seller admins can access this resource",
    });
  }
  return next({ ctx });
});

export const sellerAdminRouter = router({
  /**
   * Get revenue metrics (MRR, ARR)
   */
  getRevenueMetrics: sellerAdminProcedure.query(async () => {
    const [mrr, arr] = await Promise.all([
      sellerAdminDb.getTotalMRR(),
      sellerAdminDb.getTotalARR(),
    ]);

    return {
      mrr: mrr / 100, // Convert cents to dollars
      arr: arr / 100,
    };
  }),

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount: sellerAdminProcedure.query(async () => {
    return await sellerAdminDb.getActiveSubscriptionsCount();
  }),

  /**
   * Get all subscriptions with business details
   */
  getAllSubscriptions: sellerAdminProcedure.query(async () => {
    return await sellerAdminDb.getAllSubscriptions();
  }),

  /**
   * Get platform usage statistics
   */
  getPlatformStats: sellerAdminProcedure.query(async () => {
    return await sellerAdminDb.getPlatformStats();
  }),

  /**
   * Get growth metrics
   */
  getGrowthMetrics: sellerAdminProcedure
    .input(z.object({ days: z.number().optional().default(30) }))
    .query(async ({ input }) => {
      return await sellerAdminDb.getGrowthMetrics(input.days);
    }),

  /**
   * Get churn metrics
   */
  getChurnMetrics: sellerAdminProcedure.query(async () => {
    return await sellerAdminDb.getChurnMetrics();
  }),

  /**
   * Get recent signups
   */
  getRecentSignups: sellerAdminProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      return await sellerAdminDb.getRecentSignups(input.limit);
    }),
});
