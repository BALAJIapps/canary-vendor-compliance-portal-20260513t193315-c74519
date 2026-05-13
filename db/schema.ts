import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

/* ─────────── Better Auth tables (required shape) ─────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─────────── App tables ─────────── */

export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull().default("inactive"),
  priceId: text("price_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stripeEvent = pgTable("stripe_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb("payload").notNull(),
});

/* ─────────── Vendor Compliance Portal tables ─────────── */

export const canaryVendors = pgTable("canary_vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorEmail: text("vendor_email").notNull(),
  companyName: text("company_name").notNull(),
  category: text("category").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  reviewNote: text("review_note"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const canaryVendorDocuments = pgTable("canary_vendor_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => canaryVendors.id, { onDelete: "cascade" }),
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  documentType: text("document_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const canaryNotifications = pgTable("canary_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => canaryVendors.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
export type CanaryVendor = typeof canaryVendors.$inferSelect;
export type CanaryVendorDocument = typeof canaryVendorDocuments.$inferSelect;
export type CanaryNotification = typeof canaryNotifications.$inferSelect;
