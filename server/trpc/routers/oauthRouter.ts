import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { getDb } from "@/server/db";
import { oauthAccounts } from "@/server/../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const oauthRouter = router({
  // List linked OAuth accounts for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    const accounts = await db
      .select()
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, ctx.user.id));

    return accounts;
  }),

  // Unlink an OAuth provider
  unlink: protectedProcedure
    .input(z.object({
      provider: z.enum(["google", "microsoft"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Check if this is the only auth method
      const accounts = await db
        .select()
        .from(oauthAccounts)
        .where(eq(oauthAccounts.userId, ctx.user.id));

      // If user has no password and only one OAuth account, prevent unlinking
      if (!ctx.user.password && accounts.length === 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot unlink your only authentication method. Please set a password first or link another OAuth provider.",
        });
      }

      // Delete the OAuth account
      await db
        .delete(oauthAccounts)
        .where(
          and(
            eq(oauthAccounts.userId, ctx.user.id),
            eq(oauthAccounts.provider, input.provider)
          )
        );

      return { success: true };
    }),
});
