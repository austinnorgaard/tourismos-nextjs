import { pgTable, serial, text, timestamp, varchar, boolean, integer, numeric } from "drizzle-orm/pg-core";

/**
 * Postgres variant of the schema. Mirrors the MySQL schema but uses pg-core types.
 */

export const users = pgTable("users", {
  // Neon uses UUID primary keys for users. Use a varchar(36) to match existing DB.
  id: varchar("id", { length: 36 }).primaryKey(),
  openId: varchar("openId", { length: 64 }),
  username: varchar("username", { length: 50 }),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }),
  resetToken: varchar("resetToken", { length: 100 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 32 }).default("user").notNull(),
  businessId: integer("businessId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const teamMembers = pgTable("teamMembers", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 32 }).default("staff").notNull(),
  permissions: text("permissions"),
  invitedBy: integer("invitedBy"),
  status: varchar("status", { length: 32 }).default("invited").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  ownerId: integer("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 500 }),
  subscriptionTier: varchar("subscriptionTier", { length: 32 }).default("starter").notNull(),
  subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("trial").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  stripeAccountStatus: varchar("stripeAccountStatus", { length: 32 }),
  stripeOnboardingComplete: integer("stripeOnboardingComplete").default(0),
  vercelToken: varchar("vercelToken", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#2563eb"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#1e40af"),
  theme: varchar("theme", { length: 16 }).default("light"),
  customCss: text("customCss"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const offerings = pgTable("offerings", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 32 }).notNull(),
  price: integer("price").notNull(),
  durationMinutes: integer("durationMinutes"),
  capacity: integer("capacity"),
  location: varchar("location", { length: 255 }),
  images: text("images"),
  active: boolean("active").default(true).notNull(),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  offeringId: integer("offeringId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }),
  bookingDate: timestamp("bookingDate").notNull(),
  bookingTime: varchar("bookingTime", { length: 10 }),
  partySize: integer("partySize").default(1).notNull(),
  totalAmount: integer("totalAmount").notNull(),
  paymentStatus: varchar("paymentStatus", { length: 32 }).default("pending").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: varchar("customerName", { length: 255 }),
  messages: text("messages"),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const knowledgeBase = pgTable("knowledgeBase", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// The live Neon DB has several reporting/customer tables that use UUID primary keys.
// We add compatible definitions here (using varchar for UUIDs) so Drizzle will
// detect them as matching and avoid destructive drop/create actions.
export const customers = pgTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  image_url: varchar("image_url", { length: 500 }).notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customer_id: varchar("customer_id", { length: 36 }).notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  date: timestamp("date").notNull(),
});

export const revenue = pgTable("revenue", {
  month: varchar("month", { length: 64 }).primaryKey(),
  revenue: integer("revenue").notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  content: text("content"),
  status: varchar("status", { length: 32 }).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  recipientsCount: integer("recipientsCount").default(0),
  openRate: integer("openRate").default(0),
  clickRate: integer("clickRate").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const oauthAccounts = pgTable("oauthAccounts", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  providerEmail: varchar("providerEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  plan: varchar("plan", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).default("trial").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  trialEnd: timestamp("trialEnd"),
  mrr: integer("mrr").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const webhookEvents = pgTable("webhookEvents", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  payload: text("payload").notNull(),
  webhookUrl: varchar("webhookUrl", { length: 500 }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastAttempt: timestamp("lastAttempt"),
  response: text("response"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  domain: varchar("domain", { length: 255 }),
  subdomain: varchar("subdomain", { length: 100 }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  vercelProjectId: varchar("vercelProjectId", { length: 100 }),
  vercelDeploymentId: varchar("vercelDeploymentId", { length: 100 }),
  deploymentUrl: varchar("deploymentUrl", { length: 500 }),
  errorMessage: text("errorMessage"),
  lastDeployedAt: timestamp("lastDeployedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  businessId: integer("businessId").notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).default("connected").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  baseUrl: varchar("baseUrl", { length: 500 }),
  metadata: text("metadata"),
  lastSyncAt: timestamp("lastSyncAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
