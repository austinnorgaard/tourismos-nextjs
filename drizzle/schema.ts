import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Optional for OAuth
  username: varchar("username", { length: 50 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Hashed password for custom auth
  resetToken: varchar("resetToken", { length: 100 }).unique(),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "seller_admin"]).default("user").notNull(),
  businessId: int("businessId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Team members for businesses
 */
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(), // references businesses.id
  userId: int("userId").notNull(), // references users.id
  role: mysqlEnum("role", ["owner", "admin", "manager", "staff"]).default("staff").notNull(),
  permissions: text("permissions"), // JSON string of permissions
  invitedBy: int("invitedBy"), // references users.id
  status: mysqlEnum("status", ["active", "invited", "suspended"]).default("invited").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Tourism businesses (tour operators, hotels, activity providers, etc.)
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // references users.id
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "tour_operator",
    "hotel",
    "restaurant",
    "activity_provider",
    "rental",
    "other"
  ]).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 500 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["starter", "professional", "enterprise"]).default("starter").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trial"]).default("trial").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // Stripe Connect account
  stripeAccountStatus: mysqlEnum("stripeAccountStatus", ["pending", "active", "disabled"]),
  stripeOnboardingComplete: int("stripeOnboardingComplete").default(0), // boolean as int
  vercelToken: varchar("vercelToken", { length: 500 }), // Vercel API token for deployment
  // Public site customization
  primaryColor: varchar("primaryColor", { length: 7 }).default("#2563eb"), // Brand color (hex)
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#1e40af"), // Accent color (hex)
  theme: mysqlEnum("theme", ["light", "dark"]).default("light"),
  customCss: text("customCss"), // Advanced custom CSS
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Offerings (tours, activities, accommodations, rentals)
 */
export const offerings = mysqlTable("offerings", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "tour",
    "activity",
    "accommodation",
    "rental",
    "experience",
    "other"
  ]).notNull(),
  price: int("price").notNull(), // stored in cents
  durationMinutes: int("durationMinutes"),
  capacity: int("capacity"),
  location: varchar("location", { length: 255 }),
  images: text("images"), // JSON array of image URLs
  active: boolean("active").default(true).notNull(),
  stripeProductId: varchar("stripeProductId", { length: 255 }), // Stripe Product ID
  stripePriceId: varchar("stripePriceId", { length: 255 }), // Stripe Price ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;

/**
 * Customer bookings
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  offeringId: int("offeringId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }),
  bookingDate: timestamp("bookingDate").notNull(),
  bookingTime: varchar("bookingTime", { length: 10 }), // e.g., "09:00"
  partySize: int("partySize").default(1).notNull(),
  totalAmount: int("totalAmount").notNull(), // stored in cents
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded", "failed"]).default("pending").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "confirmed", "canceled", "completed"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Chatbot conversations
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: varchar("customerName", { length: 255 }),
  messages: text("messages"), // JSON array of messages
  status: mysqlEnum("status", ["active", "resolved"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Knowledge base for AI chatbot
 */
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Marketing campaigns
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["email", "social", "sms"]).notNull(),
  content: text("content"),
  status: mysqlEnum("status", ["draft", "scheduled", "sent"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  recipientsCount: int("recipientsCount").default(0),
  openRate: int("openRate").default(0), // stored as percentage * 100
  clickRate: int("clickRate").default(0), // stored as percentage * 100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * OAuth provider linkage for users
 */
export const oauthAccounts = mysqlTable("oauthAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // references users.id
  provider: mysqlEnum("provider", ["google", "microsoft", "apple"]).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  providerEmail: varchar("providerEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type InsertOAuthAccount = typeof oauthAccounts.$inferInsert;

/**
 * Notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // references users.id
  type: mysqlEnum("type", ["info", "success", "warning", "error", "booking", "payment", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }), // Optional link to related resource
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Subscriptions tracking for seller admin
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(), // references businesses.id
  plan: mysqlEnum("plan", ["starter", "professional", "enterprise"]).notNull(),
  status: mysqlEnum("status", ["trial", "active", "past_due", "cancelled", "expired"]).default("trial").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  trialEnd: timestamp("trialEnd"),
  mrr: int("mrr").default(0).notNull(), // Monthly recurring revenue in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Webhook events log for external integrations
 */
export const webhookEvents = mysqlTable("webhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(), // references businesses.id
  eventType: varchar("eventType", { length: 100 }).notNull(), // e.g., "booking.created", "payment.received"
  payload: text("payload").notNull(), // JSON string
  webhookUrl: varchar("webhookUrl", { length: 500 }),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastAttempt: timestamp("lastAttempt"),
  response: text("response"), // Response from webhook endpoint
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * Public website deployments for businesses
 */
export const deployments = mysqlTable("deployments", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().unique(), // references businesses.id - one deployment per business
  domain: varchar("domain", { length: 255 }), // Custom domain (e.g., hotel-montana.com)
  subdomain: varchar("subdomain", { length: 100 }), // Auto-generated subdomain (e.g., scapegrowth.tourismos.app)
  status: mysqlEnum("status", ["pending", "deploying", "deployed", "failed", "updating"]).default("pending").notNull(),
  vercelProjectId: varchar("vercelProjectId", { length: 100 }),
  vercelDeploymentId: varchar("vercelDeploymentId", { length: 100 }),
  deploymentUrl: varchar("deploymentUrl", { length: 500 }), // Live URL
  errorMessage: text("errorMessage"),
  lastDeployedAt: timestamp("lastDeployedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = typeof deployments.$inferInsert;

/**
 * Business integrations with third-party services
 */
export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(), // references businesses.id
  provider: varchar("provider", { length: 100 }).notNull(), // e.g., "google_calendar", "quickbooks", "custom"
  name: varchar("name", { length: 255 }).notNull(), // Display name
  type: mysqlEnum("type", ["oauth", "api_key", "custom"]).notNull(),
  status: mysqlEnum("status", ["connected", "disconnected", "error", "expired"]).default("connected").notNull(),
  // OAuth fields
  accessToken: text("accessToken"), // Encrypted access token
  refreshToken: text("refreshToken"), // Encrypted refresh token
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // API Key fields
  apiKey: text("apiKey"), // Encrypted API key
  apiSecret: text("apiSecret"), // Encrypted API secret
  // Custom fields
  baseUrl: varchar("baseUrl", { length: 500 }), // For custom APIs
  metadata: text("metadata"), // JSON string for additional config
  lastSyncAt: timestamp("lastSyncAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;
