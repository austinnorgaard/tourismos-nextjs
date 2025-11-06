import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import * as deploymentDb from "@/server/deploymentDb";
import * as db from "@/server/db";
import {
  createVercelProject,
  deployToVercel,
  addCustomDomain,
  removeCustomDomain,
  deleteVercelProject,
  updateProjectEnvironmentVariables,
} from "@/server/vercelService";
import { TRPCError } from "@trpc/server";

export const deploymentRouter = router({
  /**
   * Get deployment status for the user's business
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Business not found",
      });
    }

    return await deploymentDb.getDeploymentByBusinessId(business.id);
  }),

  /**
   * Deploy the public booking site
   */
  deploy: protectedProcedure.mutation(async ({ ctx }) => {
    // Get the API URL from the request origin (works in both dev and production)
    // ctx.req may be unknown in some calling contexts; safely extract origin if available
    let apiUrl = "";
    try {
      const maybeReq = ctx.req as unknown as { protocol?: string; get?: (name: string) => string | undefined; headers?: Record<string, string> } | undefined;
      if (maybeReq) {
        if (maybeReq.protocol && typeof maybeReq.get === 'function') {
          const host = maybeReq.get('host') || maybeReq.headers?.host;
          apiUrl = `${maybeReq.protocol}://${host}`;
        } else if (maybeReq.headers && (maybeReq.headers.origin || maybeReq.headers.host)) {
          apiUrl = maybeReq.headers.origin || `https://${maybeReq.headers.host}`;
        }
      }
    } catch (e) {
      apiUrl = "";
    }
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Business not found",
      });
    }

    // Check if deployment already exists
    let deployment = await deploymentDb.getDeploymentByBusinessId(business.id);

    try {
      if (!deployment) {
        // Create new deployment record
        await deploymentDb.createDeployment({
          businessId: business.id,
          status: "deploying",
          subdomain: `${business.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${business.id}`,
        });
      } else {
        // Update existing deployment to deploying status
        await deploymentDb.updateDeployment(business.id, {
          status: "deploying",
          errorMessage: null,
        });
      }

      // Create Vercel project if it doesn't exist
      let vercelProjectId = deployment?.vercelProjectId;
      if (!vercelProjectId) {
        const project = await createVercelProject(
          business.name,
          business.id,
          apiUrl,
          business.vercelToken || undefined
        );
        vercelProjectId = project.id;
        await deploymentDb.updateDeployment(business.id, {
          vercelProjectId: project.id,
        });
      } else {
        // Update environment variables for existing project
        await updateProjectEnvironmentVariables(
          vercelProjectId,
          [
            { key: "NEXT_PUBLIC_API_URL", value: apiUrl, target: ["production", "preview"] },
            { key: "NEXT_PUBLIC_BUSINESS_ID", value: business.id.toString(), target: ["production", "preview"] },
            { key: "NEXT_PUBLIC_PRIMARY_COLOR", value: business.primaryColor || "#2563eb", target: ["production", "preview"] },
            { key: "NEXT_PUBLIC_SECONDARY_COLOR", value: business.secondaryColor || "#1e40af", target: ["production", "preview"] },
            { key: "NEXT_PUBLIC_THEME", value: business.theme || "light", target: ["production", "preview"] },
          ],
          business.vercelToken || undefined
        );
      }

      // Deploy to Vercel
      const vercelDeployment = await deployToVercel({
        businessId: business.id,
        businessName: business.name,
        apiUrl: apiUrl, // Use the request origin
        vercelToken: business.vercelToken || undefined,
        primaryColor: business.primaryColor || "#2563eb",
        secondaryColor: business.secondaryColor || "#1e40af",
        theme: business.theme || "light",
      });

      // Update deployment record with success
      await deploymentDb.updateDeployment(business.id, {
        status: "deployed",
        vercelDeploymentId: vercelDeployment.id,
        deploymentUrl: `https://${vercelDeployment.url}`,
        lastDeployedAt: new Date(),
      });

      return {
        success: true,
        url: `https://${vercelDeployment.url}`,
      };
    } catch (error) {
      // Update deployment record with error
      await deploymentDb.updateDeployment(business.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Deployment failed",
      });
    }
  }),

  /**
   * Add a custom domain to the deployment
   */
  addDomain: protectedProcedure
    .input(z.object({ domain: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business not found",
        });
      }

      const deployment = await deploymentDb.getDeploymentByBusinessId(business.id);
      if (!deployment || !deployment.vercelProjectId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please deploy your site first before adding a custom domain",
        });
      }

      try {
        await addCustomDomain(
          deployment.vercelProjectId,
          input.domain,
          business.vercelToken || undefined
        );
        await deploymentDb.updateDeployment(business.id, {
          domain: input.domain,
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to add custom domain",
        });
      }
    }),

  /**
   * Remove custom domain from the deployment
   */
  removeDomain: protectedProcedure.mutation(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Business not found",
      });
    }

    const deployment = await deploymentDb.getDeploymentByBusinessId(business.id);
    if (!deployment || !deployment.vercelProjectId || !deployment.domain) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No custom domain to remove",
      });
    }

    try {
      await removeCustomDomain(
        deployment.vercelProjectId,
        deployment.domain,
        business.vercelToken || undefined
      );
      await deploymentDb.updateDeployment(business.id, {
        domain: null,
      });

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to remove custom domain",
      });
    }
  }),

  /**
   * Delete the deployment
   */
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Business not found",
      });
    }

    const deployment = await deploymentDb.getDeploymentByBusinessId(business.id);
    if (!deployment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No deployment found",
      });
    }

    try {
      // Delete from Vercel if project exists
      if (deployment.vercelProjectId) {
        await deleteVercelProject(
          deployment.vercelProjectId,
          business.vercelToken || undefined
        );
      }

      // Delete from database
      await deploymentDb.deleteDeployment(business.id);

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete deployment",
      });
    }
  }),
});
