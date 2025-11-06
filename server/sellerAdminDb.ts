import { eq, desc, sql, and, gte } from "drizzle-orm";
import { getDb } from "@/server/db";
import { subscriptions, businesses, bookings, offerings, users } from "@/drizzle/schema";

/**
 * Get total MRR (Monthly Recurring Revenue) across all active subscriptions
 */
export async function getTotalMRR(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ total: sql<number>`SUM(${subscriptions.mrr})` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    return result[0]?.total || 0;
  } catch (error) {
    console.error("[Database] Failed to get total MRR:", error);
    return 0;
  }
}

/**
 * Get total ARR (Annual Recurring Revenue)
 */
export async function getTotalARR(): Promise<number> {
  const mrr = await getTotalMRR();
  return mrr * 12;
}

/**
 * Get count of active subscriptions
 */
export async function getActiveSubscriptionsCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to get active subscriptions count:", error);
    return 0;
  }
}

/**
 * Get all subscriptions with business details
 */
export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: subscriptions.id,
        businessId: subscriptions.businessId,
        businessName: businesses.name,
        plan: subscriptions.plan,
        status: subscriptions.status,
        mrr: subscriptions.mrr,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .leftJoin(businesses, eq(subscriptions.businessId, businesses.id))
      .orderBy(desc(subscriptions.createdAt));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get all subscriptions:", error);
    return [];
  }
}

/**
 * Get platform usage statistics
 */
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalBusinesses: 0,
      totalBookings: 0,
      totalOfferings: 0,
      totalUsers: 0,
    };
  }

  try {
    const [businessCount, bookingCount, offeringCount, userCount] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(businesses),
      db.select({ count: sql<number>`COUNT(*)` }).from(bookings),
      db.select({ count: sql<number>`COUNT(*)` }).from(offerings),
      db.select({ count: sql<number>`COUNT(*)` }).from(users),
    ]);

    return {
      totalBusinesses: businessCount[0]?.count || 0,
      totalBookings: bookingCount[0]?.count || 0,
      totalOfferings: offeringCount[0]?.count || 0,
      totalUsers: userCount[0]?.count || 0,
    };
  } catch (error) {
    console.error("[Database] Failed to get platform stats:", error);
    return {
      totalBusinesses: 0,
      totalBookings: 0,
      totalOfferings: 0,
      totalUsers: 0,
    };
  }
}

/**
 * Get growth metrics for the last N days
 */
export async function getGrowthMetrics(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`DATE(${subscriptions.createdAt})`,
        count: sql<number>`COUNT(*)`,
        mrr: sql<number>`SUM(${subscriptions.mrr})`,
      })
      .from(subscriptions)
      .where(gte(subscriptions.createdAt, startDate))
      .groupBy(sql`DATE(${subscriptions.createdAt})`)
      .orderBy(sql`DATE(${subscriptions.createdAt})`);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get growth metrics:", error);
    return [];
  }
}

/**
 * Get churn metrics
 */
export async function getChurnMetrics() {
  const db = await getDb();
  if (!db) {
    return {
      cancelledCount: 0,
      activeCount: 0,
      churnRate: 0,
    };
  }

  try {
    const [cancelled, active] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "cancelled")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
    ]);

    const cancelledCount = cancelled[0]?.count || 0;
    const activeCount = active[0]?.count || 0;
    const totalCount = cancelledCount + activeCount;
    const churnRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;

    return {
      cancelledCount,
      activeCount,
      churnRate: Math.round(churnRate * 100) / 100,
    };
  } catch (error) {
    console.error("[Database] Failed to get churn metrics:", error);
    return {
      cancelledCount: 0,
      activeCount: 0,
      churnRate: 0,
    };
  }
}

/**
 * Get recent signups
 */
export async function getRecentSignups(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        type: businesses.type,
        createdAt: businesses.createdAt,
        ownerEmail: users.email,
      })
      .from(businesses)
      .leftJoin(users, eq(businesses.ownerId, users.id))
      .orderBy(desc(businesses.createdAt))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get recent signups:", error);
    return [];
  }
}
