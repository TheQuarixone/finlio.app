CREATE TYPE "public"."risk_profile" AS ENUM('conservative', 'moderate', 'aggressive');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'ultra');--> statement-breakpoint
CREATE TABLE "brief_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job" text NOT NULL,
	"run_key" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brief_logs_user_run_key" UNIQUE("user_id","run_key")
);
--> statement-breakpoint
ALTER TABLE "brief_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_minor" integer NOT NULL,
	"target_currency" text DEFAULT 'INR' NOT NULL,
	"deadline" text NOT NULL,
	"linked_asset_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"base_currency" text DEFAULT 'INR' NOT NULL,
	"risk_profile" "risk_profile" DEFAULT 'moderate' NOT NULL,
	"annual_income_minor" integer,
	"monthly_expenses_minor" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" text NOT NULL,
	"net_worth_minor" integer NOT NULL,
	"total_assets_minor" integer NOT NULL,
	"total_liabilities_minor" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"savings_rate_e4" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshots_user_month_key" UNIQUE("user_id","month")
);
--> statement-breakpoint
ALTER TABLE "snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_provider_subscription_id_unique" UNIQUE("provider_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "brief_logs_user_idx" ON "brief_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- RLS policies. drizzle-kit models `ENABLE ROW LEVEL SECURITY` but not the
-- policies themselves, and RLS with no policy denies everything — which is the
-- correct default, but not what these tables need.
--
-- Every policy is owner-only: `auth.uid()` is the caller's id from the Supabase
-- JWT, so a user reads and writes their own rows and nobody else's. Server-side
-- code connects over a direct Postgres URL and bypasses RLS; these policies are
-- what stand between PostgREST and someone else's finances.
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_owner" ON "profiles"
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "goals_owner" ON "goals"
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "snapshots_owner" ON "snapshots"
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
-- Subscriptions are readable by their owner but never writable by them: an
-- entitlement a user can write is not an entitlement. Only the DodoPayments
-- webhook writes here, server-side, bypassing RLS.
CREATE POLICY "subscriptions_owner_read" ON "subscriptions"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
-- Same reasoning: agents write the log, the user may read their own history.
CREATE POLICY "brief_logs_owner_read" ON "brief_logs"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");
