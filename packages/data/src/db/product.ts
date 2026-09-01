import { sql } from "drizzle-orm";
import {
  index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid,
} from "drizzle-orm/pg-core";

/**
 * The product tables.
 *
 * **What is not here matters as much as what is.** There is no `assets` table
 * and no `holdings` table: raw positions live on the user's device as encrypted
 * Markdown and never reach Postgres (architecture §4.4). The server keeps goal
 * metadata, derived month-end aggregates, entitlements, and job logs — enough
 * to plan and to bill, not enough to reconstruct someone's portfolio.
 *
 * Every table has RLS enabled and an owner-only policy (see the migration).
 * `.enableRLS()` here only flips the flag; the policies are SQL, because
 * drizzle-kit does not model them.
 *
 * Money is stored the way it is computed: an integer count of minor units plus
 * a currency code. `numeric` would invite a float somewhere in the stack.
 */

const money = (name: string) => integer(name);

export const riskProfile = pgEnum("risk_profile", [
  "conservative",
  "moderate",
  "aggressive",
]);

export const subscriptionTier = pgEnum("subscription_tier", ["free", "pro", "ultra"]);

export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "expired",
]);

export const profiles = pgTable("profiles", {
  /** Matches `auth.users.id`. Supabase owns the identity; this is our side. */
  userId: uuid("user_id").primaryKey(),
  baseCurrency: text("base_currency").notNull().default("INR"),
  risk: riskProfile("risk_profile").notNull().default("moderate"),
  annualIncomeMinor: money("annual_income_minor"),
  monthlyExpensesMinor: money("monthly_expenses_minor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * Mirrors DodoPayments. Written only by the webhook, never by a client — an
 * entitlement a user can write is not an entitlement. Clients read their tier
 * from here, which is also what keeps mobile off App Store IAP accounting
 * (architecture §4.6).
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    tier: subscriptionTier("tier").notNull().default("free"),
    status: subscriptionStatus("status").notNull().default("active"),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id").unique(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId)]
).enableRLS();

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    targetMinor: money("target_minor").notNull(),
    targetCurrency: text("target_currency").notNull().default("INR"),
    deadline: text("deadline").notNull(),
    /** Ids of on-device assets. Opaque to the server — it cannot resolve them. */
    linkedAssetIds: jsonb("linked_asset_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goals_user_idx").on(t.userId)]
).enableRLS();

/**
 * Month-end aggregates only (ADR-0004). Unique on (user, month) so re-running a
 * month updates it rather than growing a duplicate.
 */
export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    /** YYYY-MM */
    month: text("month").notNull(),
    netWorthMinor: money("net_worth_minor").notNull(),
    totalAssetsMinor: money("total_assets_minor").notNull(),
    totalLiabilitiesMinor: money("total_liabilities_minor").notNull(),
    currency: text("currency").notNull().default("INR"),
    savingsRateE4: integer("savings_rate_e4"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("snapshots_user_month_key").on(t.userId, t.month)]
).enableRLS();

/**
 * What the agents sent, and when. Phase 3 writes it; the table lands now so the
 * jobs have somewhere to record idempotency. `runKey` is unique per user so a
 * QStash retry cannot send the same brief twice.
 */
export const briefLogs = pgTable(
  "brief_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    job: text("job").notNull(),
    runKey: text("run_key").notNull(),
    status: text("status").notNull().default("sent"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("brief_logs_user_run_key").on(t.userId, t.runKey),
    index("brief_logs_user_idx").on(t.userId),
  ]
).enableRLS();

export type ProfileRow = typeof profiles.$inferSelect;
export type GoalRow = typeof goals.$inferSelect;
export type SnapshotRow = typeof snapshots.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
