import type { Goal, MonthlySnapshot, Profile, ProfileUpdate, SubscriptionTier } from "@finlio/schemas";

/**
 * Server-side persistence, as interfaces.
 *
 * Services depend on these; `@finlio/data` implements them over Drizzle and
 * Supabase. That inversion is what lets every service test run against a plain
 * object with no database, and what keeps Drizzle out of `packages/core`.
 *
 * Note what is absent: there is no AssetRepository. Holdings live on the
 * device and never reach Postgres (ADR-0004) — the server sees derived
 * aggregates and goal metadata, nothing more.
 */

export interface ProfileRepository {
  find(userId: string): Promise<Profile | null>;
  /** Idempotent: called on every sign-in, creates only on the first. */
  ensure(userId: string): Promise<Profile>;
  update(userId: string, patch: ProfileUpdate): Promise<Profile>;
}

export interface GoalRepository {
  list(userId: string): Promise<Goal[]>;
  create(userId: string, goal: Goal): Promise<Goal>;
  update(userId: string, goalId: string, patch: Partial<Goal>): Promise<Goal>;
  remove(userId: string, goalId: string): Promise<void>;
  count(userId: string): Promise<number>;
}

export interface SnapshotRepository {
  list(userId: string, limit?: number): Promise<MonthlySnapshot[]>;
  /** Upsert on (user, month) — re-running a month must not duplicate it. */
  put(userId: string, snapshot: MonthlySnapshot): Promise<MonthlySnapshot>;
}

export interface EntitlementRepository {
  tierFor(userId: string): Promise<SubscriptionTier>;
}
