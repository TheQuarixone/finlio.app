import { eq } from "drizzle-orm";
import type { Profile, ProfileUpdate } from "@finlio/schemas";
import type { ProfileRepository } from "@finlio/core/ports";
import type { Db } from "../db/client";
import { profiles, type ProfileRow } from "../db/product";

/** Drizzle rows are flat; the domain wants Money objects. Convert at the edge. */
function toProfile(row: ProfileRow): Profile {
  const currency = row.baseCurrency as Profile["baseCurrency"];
  return {
    userId: row.userId,
    baseCurrency: currency,
    riskProfile: row.risk,
    ...(row.annualIncomeMinor != null
      ? { annualIncome: { minor: row.annualIncomeMinor, currency } }
      : {}),
    ...(row.monthlyExpensesMinor != null
      ? { monthlyExpenses: { minor: row.monthlyExpensesMinor, currency } }
      : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createProfileRepository(db: Db): ProfileRepository {
  return {
    async find(userId) {
      const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      return row ? toProfile(row) : null;
    },

    async ensure(userId) {
      // Called on every sign-in, so it must be idempotent. `onConflictDoUpdate`
      // rather than `doNothing` so the statement always returns the row.
      const [row] = await db
        .insert(profiles)
        .values({ userId })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { updatedAt: new Date() },
        })
        .returning();
      return toProfile(row!);
    },

    async update(userId, patch: ProfileUpdate) {
      const [row] = await db
        .update(profiles)
        .set({
          ...(patch.baseCurrency ? { baseCurrency: patch.baseCurrency } : {}),
          ...(patch.riskProfile ? { risk: patch.riskProfile } : {}),
          ...(patch.annualIncome !== undefined
            ? { annualIncomeMinor: patch.annualIncome?.minor ?? null }
            : {}),
          ...(patch.monthlyExpenses !== undefined
            ? { monthlyExpensesMinor: patch.monthlyExpenses?.minor ?? null }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId))
        .returning();
      return toProfile(row!);
    },
  };
}
