import { eq, and } from "drizzle-orm";
import { getDb } from "@/server/db";
import { integrations, InsertIntegration, Integration } from "@/drizzle/schema";

/**
 * Get all integrations for a business
 */
export async function listIntegrationsByBusiness(businessId: number): Promise<Integration[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(integrations).where(eq(integrations.businessId, businessId));
}

/**
 * Get a specific integration by ID
 */
export async function getIntegrationById(id: number): Promise<Integration | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
  return result[0];
}

/**
 * Get integration by business and provider
 */
export async function getIntegrationByProvider(
  businessId: number,
  provider: string
): Promise<Integration | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.businessId, businessId), eq(integrations.provider, provider)))
    .limit(1);
  return result[0];
}

/**
 * Create a new integration
 */
export async function createIntegration(data: InsertIntegration): Promise<Integration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(integrations).values(data);
  const insertedId = Number(result[0].insertId);
  
  const integration = await getIntegrationById(insertedId);
  if (!integration) throw new Error("Failed to create integration");
  
  return integration;
}

/**
 * Update an integration
 */
export async function updateIntegration(
  id: number,
  data: Partial<InsertIntegration>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(integrations).set(data).where(eq(integrations.id, id));
}

/**
 * Delete an integration
 */
export async function deleteIntegration(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(integrations).where(eq(integrations.id, id));
}

/**
 * Update integration status
 */
export async function updateIntegrationStatus(
  id: number,
  status: "connected" | "disconnected" | "error" | "expired",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(integrations)
    .set({ status, errorMessage: errorMessage || null })
    .where(eq(integrations.id, id));
}
