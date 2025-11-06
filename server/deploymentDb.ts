import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { deployments, InsertDeployment } from "@/drizzle/schema";

export async function createDeployment(deployment: InsertDeployment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(deployments).values(deployment);
  return result;
}

export async function getDeploymentByBusinessId(businessId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(deployments)
    .where(eq(deployments.businessId, businessId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateDeployment(businessId: number, updates: Partial<InsertDeployment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(deployments)
    .set(updates)
    .where(eq(deployments.businessId, businessId));
}

export async function deleteDeployment(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(deployments)
    .where(eq(deployments.businessId, businessId));
}

export async function listAllDeployments() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(deployments);
}
