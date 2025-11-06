// @ts-nocheck
import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import type { Drizzle } from 'drizzle-orm';
import type { Pool as PgPool } from 'pg';
import { 
  InsertUser, 
  users, 
  businesses, 
  InsertBusiness,
  offerings,
  InsertOffering,
  bookings,
  InsertBooking,
  conversations,
  InsertConversation,
  knowledgeBase,
  InsertKnowledgeBase,
  campaigns,
  InsertCampaign,
  teamMembers,
  InsertTeamMember,
  oauthAccounts,
  InsertOAuthAccount,
  notifications,
  InsertNotification,
  subscriptions,
  InsertSubscription,
  webhookEvents,
  InsertWebhookEvent
} from "@/drizzle/schema";
import { ENV } from './_core/env';

let _db: Drizzle | null = null;
let _pgPool: PgPool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = process.env.DATABASE_URL;
      if (url.startsWith('postgres:') || url.startsWith('postgresql:')) {
        // Use pg Pool for Postgres/Neon
        const { Pool } = await import('pg');
        let drizzlePg: any;
        // Avoid static ESM imports here so the Next/Turbopack bundler doesn't try to
        // resolve driver packages at build time. Instead, load the driver at runtime
        // using a non-analysable require. Prefer the package that is present in
        // package.json (drizzle-orm-pg) but fall back to other known names.
        const tryLoadDriver = async (names: string[]) => {
          for (const name of names) {
            try {
              // Use Function constructor to create a dynamic require that bundlers
              // won't statically analyze.
               
              const req = new Function('name', 'return require(name)');
              const mod = req(name);
              if (mod && (mod.drizzle || mod.default?.drizzle)) {
                return mod.drizzle || mod.default.drizzle;
              }
            } catch (err) {
              // ignore and try next
            }
          }
          return null;
        };

        drizzlePg = await tryLoadDriver(['drizzle-orm-pg', 'drizzle-orm/pg']);
        if (!drizzlePg) {
          const err = new Error('[Database] Could not load a Postgres drizzle driver.');
          console.error(err);
          throw err;
        }
        if (!_pgPool) {
          _pgPool = new Pool({ connectionString: url });
        }
        _db = drizzlePg(_pgPool);
      } else {
        // Fallback to mysql2
        const { drizzle: drizzleMysql } = await import('drizzle-orm/mysql2');
        _db = drizzleMysql(url);
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Management ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email,
      openId: user.openId || null,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      if (field === "email" && normalized) {
        values[field] = normalized;
        updateSet[field] = normalized;
      } else if (field !== "email") {
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.businessId !== undefined) {
      values.businessId = user.businessId;
      updateSet.businessId = user.businessId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Use email as the unique key for upsert
    const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      await db.update(users).set(updateSet).where(eq(users.email, user.email));
    } else {
      // Insert new user
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Business Management ============

export async function createBusiness(data: InsertBusiness) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(businesses).values(data);
  return result;
}

export async function getBusinessById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBusinessByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBusiness(id: number, data: Partial<InsertBusiness>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(businesses).set(data).where(eq(businesses.id, id));
}

export async function listBusinesses() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
}

// ============ Offerings Management ============

export async function createOffering(data: InsertOffering) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(offerings).values(data);
  return result;
}

export async function getOfferingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(offerings).where(eq(offerings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listOfferingsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(offerings)
    .where(eq(offerings.businessId, businessId))
    .orderBy(desc(offerings.createdAt));
}

export async function updateOffering(id: number, data: Partial<InsertOffering>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(offerings).set(data).where(eq(offerings.id, id));
}

export async function deleteOffering(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(offerings).where(eq(offerings.id, id));
}

// ============ Bookings Management ============

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(data);
  return result;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listBookingsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(eq(bookings.businessId, businessId))
    .orderBy(desc(bookings.bookingDate));
}

export async function listBookingsByDateRange(businessId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(
      and(
        eq(bookings.businessId, businessId),
        gte(bookings.bookingDate, startDate),
        lte(bookings.bookingDate, endDate)
      )
    )
    .orderBy(desc(bookings.bookingDate));
}

export async function updateBooking(id: number, data: Partial<InsertBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

// ============ Conversations Management ============

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data);
  return result;
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listConversationsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(conversations)
    .where(eq(conversations.businessId, businessId))
    .orderBy(desc(conversations.updatedAt));
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// ============ Knowledge Base Management ============

export async function createKnowledgeBase(data: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(knowledgeBase).values(data);
  return result;
}

export async function listKnowledgeBaseByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(knowledgeBase)
    .where(eq(knowledgeBase.businessId, businessId))
    .orderBy(desc(knowledgeBase.createdAt));
}

export async function updateKnowledgeBase(id: number, data: Partial<InsertKnowledgeBase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(knowledgeBase).set(data).where(eq(knowledgeBase.id, id));
}

export async function deleteKnowledgeBase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
}

// ============ Campaigns Management ============

export async function createCampaign(data: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(campaigns).values(data);
  return result;
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listCampaignsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaigns)
    .where(eq(campaigns.businessId, businessId))
    .orderBy(desc(campaigns.createdAt));
}

export async function updateCampaign(id: number, data: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ============ Team Members Management ============

export async function createTeamMember(data: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(teamMembers).values(data);
  return result;
}

export async function getTeamMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listTeamMembersByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    teamMember: teamMembers,
    user: users
  })
  .from(teamMembers)
  .leftJoin(users, eq(teamMembers.userId, users.id))
  .where(eq(teamMembers.businessId, businessId))
  .orderBy(desc(teamMembers.createdAt));
  
  return result;
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function getTeamMemberByUserId(businessId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(teamMembers)
    .where(and(eq(teamMembers.businessId, businessId), eq(teamMembers.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ OAuth Account Linking ============

export async function createOAuthAccount(data: InsertOAuthAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(oauthAccounts).values(data);
  return result;
}

export async function getOAuthAccountByProvider(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider as any)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listOAuthAccountsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(oauthAccounts)
    .where(eq(oauthAccounts.userId, userId))
    .orderBy(desc(oauthAccounts.createdAt));
}

export async function deleteOAuthAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(oauthAccounts).where(eq(oauthAccounts.id, id));
}

export async function getUserByProviderAccount(provider: string, providerAccountId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select({ user: users, oauthAccount: oauthAccounts })
    .from(oauthAccounts)
    .leftJoin(users, eq(oauthAccounts.userId, users.id))
    .where(
      and(
        eq(oauthAccounts.provider, provider as any),
        eq(oauthAccounts.providerAccountId, providerAccountId)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0].user : undefined;
}

// ============ Username & Password Reset ============

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmailOrUsername(identifier: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setPasswordResetToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({
    resetToken: token,
    resetTokenExpiry: expiry
  }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function clearPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({
    resetToken: null,
    resetTokenExpiry: null
  }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}


// ============ Notifications Management ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getNotificationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function listUnreadNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(notifications).where(eq(notifications.id, id));
}

// ============ Subscriptions Management ============

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subscriptions).values(data);
  return result;
}

export async function getSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSubscriptionByBusinessId(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.businessId, businessId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listAllSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));
}

export async function listActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(subscriptions)
    .where(eq(subscriptions.status, "active"))
    .orderBy(desc(subscriptions.createdAt));
}

export async function updateSubscription(id: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subscriptions).set(data).where(eq(subscriptions.id, id));
}

// ============ Webhook Events Management ============

export async function createWebhookEvent(data: InsertWebhookEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(webhookEvents).values(data);
  return result;
}

export async function getWebhookEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listWebhookEventsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(webhookEvents)
    .where(eq(webhookEvents.businessId, businessId))
    .orderBy(desc(webhookEvents.createdAt));
}

export async function listPendingWebhookEvents() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(webhookEvents)
    .where(eq(webhookEvents.status, "pending"))
    .orderBy(desc(webhookEvents.createdAt));
}

export async function updateWebhookEvent(id: number, data: Partial<InsertWebhookEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(webhookEvents).set(data).where(eq(webhookEvents.id, id));
}
