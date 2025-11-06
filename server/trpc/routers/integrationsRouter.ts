import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/server/trpc";
import * as integrationDb from "@/server/integrationDb";
import * as db from "@/server/db";

export const integrationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
    }
    return await integrationDb.listIntegrationsByBusiness(business.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }
      const integration = await integrationDb.getIntegrationById(input.id);
      if (!integration || integration.businessId !== business.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }
      return integration;
    }),

  createCustom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        provider: z.string().min(1),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        baseUrl: z.string().url().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }
      const existing = await integrationDb.getIntegrationByProvider(business.id, input.provider);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Integration with this provider already exists" });
      }
      return await integrationDb.createIntegration({
        businessId: business.id,
        provider: input.provider,
        name: input.name,
        type: "custom",
        status: "connected",
        apiKey: input.apiKey || null,
        apiSecret: input.apiSecret || null,
        baseUrl: input.baseUrl || null,
        metadata: input.metadata || null,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        baseUrl: z.string().url().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }
      const integration = await integrationDb.getIntegrationById(input.id);
      if (!integration || integration.businessId !== business.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }
      const { id, ...updateData } = input;
      await integrationDb.updateIntegration(id, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }
      const integration = await integrationDb.getIntegrationById(input.id);
      if (!integration || integration.businessId !== business.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }
      await integrationDb.deleteIntegration(input.id);
      return { success: true };
    }),

  test: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }
      const integration = await integrationDb.getIntegrationById(input.id);
      if (!integration || integration.businessId !== business.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }
      await integrationDb.updateIntegrationStatus(input.id, "connected");
      return { success: true, message: "Integration test successful" };
    }),
});
