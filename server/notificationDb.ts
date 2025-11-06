import { eq, desc, and } from "drizzle-orm";
import { getDb } from "@/server/db";
import { notifications, InsertNotification, Notification } from "@/drizzle/schema";

/**
 * Create a new notification
 */
export async function createNotification(data: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return;
  }

  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Get all notifications for a user
 */
export async function getNotificationsByUserId(userId: number, limit: number = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notifications: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to get notifications:", error);
    return [];
  }
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get unread count: database not available");
    return 0;
  }

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    
    return result.length;
  } catch (error) {
    console.error("[Database] Failed to get unread count:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notification as read: database not available");
    return;
  }

  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark all as read: database not available");
    return;
  }

  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
  } catch (error) {
    console.error("[Database] Failed to mark all as read:", error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete notification: database not available");
    return;
  }

  try {
    await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  } catch (error) {
    console.error("[Database] Failed to delete notification:", error);
    throw error;
  }
}
