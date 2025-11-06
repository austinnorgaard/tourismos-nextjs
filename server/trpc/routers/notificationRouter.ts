import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import * as notificationDb from "@/server/notificationDb";
import { sseService } from "@/server/sseService";

export const notificationRouter = router({
  /**
   * Get all notifications for the current user
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      return await notificationDb.getNotificationsByUserId(ctx.user.id, input.limit);
    }),

  /**
   * Get unread notification count
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await notificationDb.getUnreadCount(ctx.user.id);
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await notificationDb.markAsRead(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await notificationDb.markAllAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await notificationDb.deleteNotification(input.id, ctx.user.id);
      return { success: true };
    }),
});
