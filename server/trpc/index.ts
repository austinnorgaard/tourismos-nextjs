import { COOKIE_NAME } from "@/shared/const";
import { getSessionCookieOptions } from "@/server/_core/cookies";
import { systemRouter } from "@/server/_core/systemRouter";
import { oauthRouter } from "@/server/trpc/routers/oauthRouter";
import { publicRouter } from "@/server/trpc/routers/publicRouter";
import { deploymentRouter } from "@/server/trpc/routers/deploymentRouter";
import { notificationRouter } from "@/server/trpc/routers/notificationRouter";
import { sellerAdminRouter } from "@/server/trpc/routers/sellerAdminRouter";
import { integrationsRouter } from "@/server/trpc/routers/integrationsRouter";
import { paymentRouter } from "@/server/trpc/routers/paymentRouter";
import { publicProcedure, protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import * as db from "@/server/db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "@/server/_core/llm";

type KnowledgeBaseEntry = {
  id: number;
  businessId: number;
  content: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
};
import Stripe from "stripe";
import { SUBSCRIPTION_PRODUCTS } from "@/server/products";
import { ENV } from "@/server/_core/env";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export const appRouter = router({
  system: systemRouter,
  oauth: oauthRouter,
  public: publicRouter,
  deployment: deploymentRouter,
  notifications: notificationRouter,
  sellerAdmin: sellerAdminRouter,
  payment: paymentRouter,
  integrations: integrationsRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // Logout handled client-side by clearing cookie
      return { success: true } as const;
    }),
  }),

  // ============ Business Management ============
  business: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      return business || null;
    }),



    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["tour_operator", "hotel", "restaurant", "activity_provider", "rental", "other"]),
        description: z.string().optional(),
        location: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already has a business
        const existing = await db.getBusinessByOwnerId(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User already has a business" });
        }

        await db.createBusiness({
          ownerId: ctx.user.id,
          ...input,
        });

        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        type: z.enum(["tour_operator", "hotel", "restaurant", "activity_provider", "rental", "other"]).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        logoUrl: z.string().url().optional(),
        vercelToken: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        theme: z.enum(["light", "dark"]).optional(),
        customCss: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }

        await db.updateBusiness(business.id, input);
        return { success: true };
      }),
  }),

  // ============ Offerings Management ============
  offerings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) return [];

      return await db.listOfferingsByBusiness(business.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getOfferingById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["tour", "activity", "accommodation", "rental", "experience", "other"]),
        price: z.number().int().positive(),
        durationMinutes: z.number().int().positive().optional(),
        capacity: z.number().int().positive().optional(),
        location: z.string().optional(),
        images: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }

        // Create Stripe Product if Stripe is connected
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;
        
        if (business.stripeAccountId && business.stripeOnboardingComplete) {
          try {
            const { createStripeProduct } = await import("../stripeProductService");
            const stripeProduct = await createStripeProduct({
              name: input.name,
              description: input.description,
              price: input.price,
              stripeAccountId: business.stripeAccountId,
            });
            stripeProductId = stripeProduct.productId;
            stripePriceId = stripeProduct.priceId;
          } catch (error) {
            console.error("Failed to create Stripe product:", error);
            // Continue without Stripe product - can be created later
          }
        }

        await db.createOffering({
          businessId: business.id,
          ...input,
          stripeProductId,
          stripePriceId,
        });

        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(["tour", "activity", "accommodation", "rental", "experience", "other"]).optional(),
        price: z.number().int().positive().optional(),
        durationMinutes: z.number().int().positive().optional(),
        capacity: z.number().int().positive().optional(),
        location: z.string().optional(),
        images: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Get offering and business for Stripe sync
        const offering = await db.getOfferingById(id);
        if (!offering) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
        }
        
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }
        
        // Sync with Stripe if connected
        if (business.stripeAccountId && offering.stripeProductId) {
          try {
            const { updateStripeProduct, createNewPrice } = await import("./../stripeProductService");
            
            // Update product name/description
            if (input.name || input.description !== undefined) {
              await updateStripeProduct({
                productId: offering.stripeProductId,
                name: input.name,
                description: input.description,
                stripeAccountId: business.stripeAccountId,
              });
            }
            
            // Create new price if price changed
            if (input.price && input.price !== offering.price) {
              const newPriceId = await createNewPrice({
                productId: offering.stripeProductId,
                price: input.price,
                stripeAccountId: business.stripeAccountId,
              });
              (data as { [key: string]: unknown }).stripePriceId = newPriceId as unknown as string;
            }
          } catch (error) {
            console.error("Failed to sync with Stripe:", error);
            // Continue with local update even if Stripe sync fails
          }
        }
        
        await db.updateOffering(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOffering(input.id);
        return { success: true };
      }),
  }),

  // ============ Bookings Management ============
  bookings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) return [];

      return await db.listBookingsByBusiness(business.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getBookingById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        businessId: z.number(),
        offeringId: z.number(),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        bookingDate: z.date(),
        bookingTime: z.string().optional(),
        partySize: z.number().int().positive(),
        totalAmount: z.number().int().positive(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const bookingId = await db.createBooking(input);
        
        // Send confirmation email to customer
        try {
          const business = await db.getBusinessById(input.businessId);
          const offering = await db.getOfferingById(input.offeringId);
          
          if (business && offering) {
            const emailContent = `
Dear ${input.customerName},

Thank you for your booking with ${business.name}!

**Booking Details:**
- Service: ${offering.name}
- Date: ${input.bookingDate.toLocaleDateString()}
${input.bookingTime ? `- Time: ${input.bookingTime}` : ''}
- Party Size: ${input.partySize}
- Total Amount: $${(input.totalAmount / 100).toFixed(2)}

${input.notes ? `Notes: ${input.notes}\n\n` : ''}Your booking is currently pending confirmation. We will contact you shortly to confirm your reservation.

If you have any questions, please contact us:
${business.phone ? `Phone: ${business.phone}\n` : ''}${business.email ? `Email: ${business.email}\n` : ''}

Thank you for choosing ${business.name}!

Best regards,
${business.name} Team
            `.trim();
            
            // In production, send actual email via email service
            // For now, we'll log it
            console.log('Booking confirmation email:', {
              to: input.customerEmail,
              subject: `Booking Confirmation - ${business.name}`,
              content: emailContent,
            });
          }
        } catch (error) {
          console.error('Failed to send booking confirmation email:', error);
          // Don't fail the booking if email fails
        }
        
        return { success: true, bookingId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "canceled", "completed"]).optional(),
        paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Get booking details before update
        const booking = await db.getBookingById(id);
        
        await db.updateBooking(id, data);
        
        // Send status update email if status changed
        if (booking && data.status && data.status !== booking.status) {
          try {
            const business = await db.getBusinessById(booking.businessId);
            const offering = await db.getOfferingById(booking.offeringId);
            
            if (business && offering) {
              let statusMessage = '';
              if (data.status === 'confirmed') {
                statusMessage = 'Your booking has been confirmed! We look forward to seeing you.';
              } else if (data.status === 'canceled') {
                statusMessage = 'Your booking has been canceled. If you have any questions, please contact us.';
              } else if (data.status === 'completed') {
                statusMessage = 'Thank you for choosing us! We hope you enjoyed your experience.';
              }
              
              const emailContent = `
Dear ${booking.customerName},

${statusMessage}

**Booking Details:**
- Service: ${offering.name}
- Date: ${new Date(booking.bookingDate).toLocaleDateString()}
${booking.bookingTime ? `- Time: ${booking.bookingTime}` : ''}
- Party Size: ${booking.partySize}
- Status: ${data.status.toUpperCase()}

If you have any questions, please contact us:
${business.phone ? `Phone: ${business.phone}\n` : ''}${business.email ? `Email: ${business.email}\n` : ''}

Best regards,
${business.name} Team
              `.trim();
              
              console.log('Booking status update email:', {
                to: booking.customerEmail,
                subject: `Booking ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} - ${business.name}`,
                content: emailContent,
              });
            }
          } catch (error) {
            console.error('Failed to send booking status email:', error);
          }
        }
        
        return { success: true };
      }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) return [];

        return await db.listBookingsByDateRange(business.id, input.startDate, input.endDate);
      }),
  }),

  // ============ Chatbot & Conversations ============
  chatbot: router({
    sendMessage: publicProcedure
      .input(z.object({
        businessId: z.number(),
        conversationId: z.number().optional(),
        message: z.string().min(1),
        customerEmail: z.string().email().optional(),
        customerName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        let conversation;
        
        // Get or create conversation
        if (input.conversationId) {
          conversation = await db.getConversationById(input.conversationId);
        }
        
        if (!conversation) {
          const result = await db.createConversation({
            businessId: input.businessId,
            customerEmail: input.customerEmail || null,
            customerName: input.customerName || null,
            messages: JSON.stringify([]),
            status: "active",
          });
          const conversationId = Number(result[0].insertId);
          conversation = await db.getConversationById(conversationId);
        }

        if (!conversation) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create conversation" });
        }

        // Parse existing messages
        const messages = conversation.messages ? JSON.parse(conversation.messages) : [];
        
        // Add user message
        messages.push({
          role: "user",
          content: input.message,
          timestamp: new Date().toISOString(),
        });

        // Get business context
        const business = await db.getBusinessById(input.businessId);
        const offerings = await db.listOfferingsByBusiness(input.businessId);
        const knowledgeBase = await db.listKnowledgeBaseByBusiness(input.businessId);

        // Build context for AI
        let context = `You are a helpful AI assistant for ${business?.name || "a tourism business"}.`;
        
        if (business?.description) {
          context += `\n\nBusiness Description: ${business.description}`;
        }

        if (offerings.length > 0) {
          context += `\n\nAvailable Offerings:\n`;
          offerings.forEach(offering => {
            context += `- ${offering.name}: ${offering.description || "No description"} (Price: $${(offering.price / 100).toFixed(2)}`;
            if (offering.durationMinutes) {
              context += `, Duration: ${offering.durationMinutes} minutes`;
            }
            context += `)\n`;
          });
        }

        // Semantic search: Find most relevant knowledge base entries
        if (knowledgeBase.length > 0) {
          // Use AI to find relevant knowledge base entries based on user query
          const kbSearchPrompt = `Given this user question: "${input.message}"

Which of these knowledge base entries are most relevant? Return the IDs of the 3 most relevant entries (or fewer if less are relevant).

Knowledge Base:
${knowledgeBase.map((kb, idx) => `ID ${idx}: ${kb.content}`).join('\n\n')}

Respond with only the relevant IDs as a comma-separated list (e.g., "0,2,5"). If none are relevant, respond with "none".`;

          try {
            const searchResponse = await invokeLLM({
              messages: [
                { role: "system", content: "You are a semantic search assistant. Analyze relevance and return only IDs." },
                { role: "user", content: kbSearchPrompt },
              ],
            });

            const searchResultContent = searchResponse.choices[0]?.message?.content;
            const searchResult = typeof searchResultContent === 'string' ? searchResultContent : "none";
            
            if (searchResult !== "none" && searchResult.trim() !== "") {
              const relevantIds = searchResult.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
              const relevantKB = relevantIds.map((id: number) => knowledgeBase[id]).filter((k): k is KnowledgeBaseEntry => !!k);

              if (relevantKB.length > 0) {
                context += `\n\nRelevant Information:\n`;
                relevantKB.forEach((kb) => {
                  if (typeof kb.content === 'string') context += `${kb.content}\n`;
                });
              }
            }
          } catch (err) {
            console.debug('Semantic search error', err);
            // Fallback to showing all knowledge base entries if semantic search fails
            context += `\n\nAdditional Information:\n`;
            knowledgeBase.forEach((kb) => {
              if ((kb as KnowledgeBaseEntry) && typeof (kb as KnowledgeBaseEntry).content === 'string') {
                context += `${(kb as KnowledgeBaseEntry).content}\n`;
              }
            });
          }
        }

        context += `\n\nYou should help customers learn about offerings, answer questions, and assist with bookings. Be friendly, helpful, and professional.`;

        // Call AI
        const aiMessages = [
          { role: "system" as const, content: context },
          ...messages.slice(-10).map((m: unknown) => {
            const mm = m as Record<string, unknown>;
            return { role: typeof mm.role === 'string' ? mm.role : 'user', content: typeof mm.content === 'string' ? mm.content : '' };
          }),
        ];

        const response = await invokeLLM({ messages: aiMessages });
        const responseContent = response.choices[0]?.message?.content;
        const aiReply = typeof responseContent === 'string' ? responseContent : "I apologize, but I'm having trouble responding right now.";

        // Add AI response
        messages.push({
          role: "assistant",
          content: aiReply,
          timestamp: new Date().toISOString(),
        });

        // Update conversation
        await db.updateConversation(conversation.id, {
          messages: JSON.stringify(messages),
        });

        return {
          conversationId: conversation.id,
          message: aiReply,
        };
      }),

    listConversations: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) return [];

      return await db.listConversationsByBusiness(business.id);
    }),

    getConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getConversationById(input.id);
      }),
  }),

  // ============ Knowledge Base ============
  knowledgeBase: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) return [];

      return await db.listKnowledgeBaseByBusiness(business.id);
    }),

    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }

        await db.createKnowledgeBase({
          businessId: business.id,
          ...input,
        });

        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateKnowledgeBase(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteKnowledgeBase(input.id);
        return { success: true };
      }),
  }),

  // ============ AI Features ============
  ai: router({
    generateEmail: protectedProcedure
      .input(z.object({
        goal: z.string(),
        targetAudience: z.string(),
        keyMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `Generate a professional email for a tourism business with the following details:
        
Goal: ${input.goal}
Target Audience: ${input.targetAudience}
Key Message: ${input.keyMessage}

Please provide:
1. A compelling subject line
2. Email body content that is friendly, professional, and engaging

Format your response as JSON with "subject" and "body" fields.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a marketing expert specializing in tourism and hospitality." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "email_content",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  body: { type: "string" },
                },
                required: ["subject", "body"],
                additionalProperties: false,
              },
            },
          },
        });

        const responseContent = response.choices[0]?.message?.content;
        const contentStr = typeof responseContent === 'string' ? responseContent : "{}";
        const content = JSON.parse(contentStr);
        return content;
      }),

    generateSocialPost: protectedProcedure
      .input(z.object({
        topic: z.string(),
        platform: z.enum(["facebook", "instagram", "twitter"]),
      }))
      .mutation(async ({ input }) => {
        const platformGuidelines = {
          facebook: "conversational and community-focused, 1-2 paragraphs",
          instagram: "visual and inspiring, with relevant hashtags",
          twitter: "concise and engaging, under 280 characters",
        };

        const prompt = `Create a ${input.platform} post for a tourism business about: ${input.topic}

Style: ${platformGuidelines[input.platform]}

Provide the post content and relevant hashtags.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a social media expert for tourism businesses." },
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0]?.message?.content;
        const postContent = typeof content === 'string' ? content : "";
        
        return {
          content: postContent,
        };
      }),

    getInsights: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) return { insights: [] };

      const bookings = await db.listBookingsByBusiness(business.id);
      const offerings = await db.listOfferingsByBusiness(business.id);

      // Calculate basic metrics
      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
      
      const prompt = `Analyze this tourism business data and provide 3-5 actionable insights:

Business: ${business.name}
Total Bookings: ${bookings.length}
Confirmed Bookings: ${confirmedBookings}
Total Revenue: $${(totalRevenue / 100).toFixed(2)}
Number of Offerings: ${offerings.length}

Provide insights about booking patterns, revenue opportunities, and recommendations for improvement.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a business analytics expert for tourism companies." },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const insightsText = typeof content === 'string' ? content : "No insights available at this time.";
      
      return {
        insights: insightsText,
      };
    }),
  }),

  // ============ Payment & Subscriptions ============
  payments: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        tier: z.enum(["starter", "professional", "enterprise"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });
        }

        const product = SUBSCRIPTION_PRODUCTS[input.tier];
        
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            business_id: business.id.toString(),
            tier: input.tier,
          },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: product.name,
                  description: product.description,
                },
                unit_amount: product.price,
                recurring: {
                  interval: product.interval,
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${(ctx.req && typeof (ctx.req as any).headers === 'object' && ((ctx.req as any).headers.origin || ((ctx.req as any).headers as Record<string, string>)?.origin)) || ''}/settings?payment=success`,
          cancel_url: `${(ctx.req && typeof (ctx.req as any).headers === 'object' && ((ctx.req as any).headers.origin || ((ctx.req as any).headers as Record<string, string>)?.origin)) || ''}/settings?payment=cancelled`,
          allow_promotion_codes: true,
        });

        return { url: session.url };
      }),

    getSubscriptionInfo: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        return null;
      }

      return {
        tier: business.subscriptionTier,
        status: business.subscriptionStatus,
      };
    }),

    // Stripe Connect endpoints
    createConnectAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });
      }

      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: "express",
        email: ctx.user.email || undefined,
        business_type: "company",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          business_id: business.id.toString(),
          user_id: ctx.user.id.toString(),
        },
      });

      // Update business with Stripe account ID
      await db.updateBusiness(business.id, {
        stripeAccountId: account.id,
        stripeAccountStatus: "pending",
        stripeOnboardingComplete: 0,
      });

      return { accountId: account.id };
    }),

    createConnectAccountLink: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business || !business.stripeAccountId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe account found" });
      }

      const accountLink = await stripe.accountLinks.create({
        account: business.stripeAccountId,
        refresh_url: `${(ctx.req && typeof (ctx.req as unknown) === 'object' && ((ctx.req as any).headers?.origin || (((ctx.req as unknown) as Record<string, unknown>).headers && (( (ctx.req as unknown) as any).headers.origin)))) || ''}/settings?stripe=refresh`,
        return_url: `${(ctx.req && typeof (ctx.req as unknown) === 'object' && ((ctx.req as any).headers?.origin || (((ctx.req as unknown) as Record<string, unknown>).headers && (( (ctx.req as unknown) as any).headers.origin)))) || ''}/settings?stripe=success`,
        type: "account_onboarding",
      });

      return { url: accountLink.url };
    }),

    getConnectAccountStatus: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business || !business.stripeAccountId) {
        return { connected: false };
      }

      try {
        const account = await stripe.accounts.retrieve(business.stripeAccountId);
        
        const isComplete = account.details_submitted && 
                          account.charges_enabled && 
                          account.payouts_enabled;

        // Update business if onboarding is complete
        if (isComplete && !business.stripeOnboardingComplete) {
          await db.updateBusiness(business.id, {
            stripeAccountStatus: "active",
            stripeOnboardingComplete: 1,
          });
        }

        return {
          connected: true,
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: isComplete,
        };
      } catch (err) {
        console.debug('Stripe price update error', err);
        return { connected: false, error: "Failed to retrieve account" };
      }
    }),

    disconnectAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business || !business.stripeAccountId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe account found" });
      }

      // Delete Stripe account
      await stripe.accounts.del(business.stripeAccountId);

      // Update business
      await db.updateBusiness(business.id, {
        stripeAccountId: null,
        stripeAccountStatus: null,
        stripeOnboardingComplete: 0,
      });

      return { success: true };
    }),
  }),

  // ============ Marketing Campaigns ============
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });
      }
      return db.listCampaignsByBusiness(business.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["email", "social", "sms"]),
        status: z.enum(["draft", "scheduled", "sent"]).default("draft"),
        subject: z.string().optional(),
        content: z.string(),
        scheduledFor: z.date().optional(),
        targetAudience: z.string().optional(),
      }))
  .mutation(async ({ ctx, input }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });
        }

        await db.createCampaign({
          businessId: business.id,
          ...input,
        });

        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        status: z.enum(["draft", "scheduled", "sent"]).optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        scheduledFor: z.date().optional(),
        targetAudience: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateCampaign(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCampaign(input.id);
        return { success: true };
      }),

    send: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateCampaign(input.id, {
          status: "sent",
          sentAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ============ File Upload ============
  upload: router({
    image: protectedProcedure
      .input(z.object({
        image: z.string(), // base64 encoded image
        filename: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("@/server/storage");
        
        // Extract base64 data and convert to buffer
        const base64Data = input.image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.filename.split('.').pop() || 'png';
        const fileKey = `${ctx.user.id}/images/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Determine content type
        const contentType = input.image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, contentType);
        
        return { url };
      }),
      
    getUploadUrl: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop();
        const fileKey = `${ctx.user.id}/uploads/${timestamp}-${randomSuffix}.${fileExtension}`;

        // In a real implementation, you would generate a presigned URL for direct upload
        // For now, we'll return the key and handle upload on the server
        return {
          fileKey,
          uploadUrl: `/api/upload/${fileKey}`,
        };
      }),
  }),

  // ============ Analytics ============
  analytics: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        return {
          totalBookings: 0,
          totalRevenue: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
        };
      }

      const bookings = await db.listBookingsByBusiness(business.id);
      
      return {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
        pendingBookings: bookings.filter(b => b.status === "pending").length,
        confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      };
    }),
  }),

  // ============ Team Management ============
  team: router({  
    list: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });
      }
      return db.listTeamMembersByBusiness(business.id);
    }),

    invite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(["admin", "manager", "staff"]),
        permissions: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No business found" });
        }

        // Check if user exists
        const existingUser = await db.getUserByEmail(input.email);
        
        if (existingUser) {
          // Check if already a team member
          const existing = await db.getTeamMemberByUserId(business.id, existingUser.id);
          if (existing) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "User is already a team member" });
          }

          await db.createTeamMember({
            businessId: business.id,
            userId: existingUser.id,
            role: input.role,
            permissions: input.permissions,
            invitedBy: ctx.user.id,
            status: "active",
          });
        } else {
          // Create placeholder user and send invitation
          // In production, this would send an email invitation
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: "User not found. Invitation system not yet implemented." 
          });
        }

        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(["admin", "manager", "staff"]).optional(),
        permissions: z.string().optional(),
        status: z.enum(["active", "invited", "suspended"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateTeamMember(id, updates);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTeamMember(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
