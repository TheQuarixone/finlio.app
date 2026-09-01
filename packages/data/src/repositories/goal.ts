import { and, count, desc, eq } from "drizzle-orm";
import type { CurrencyCode, Goal } from "@finlio/schemas";
import type { GoalRepository } from "@finlio/core/ports";
import type { Db } from "../db/client";
import { goals, type GoalRow } from "../db/product";

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    target: { minor: row.targetMinor, currency: row.targetCurrency as CurrencyCode },
    deadline: row.deadline,
    linkedAssetIds: row.linkedAssetIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createGoalRepository(db: Db): GoalRepository {
  return {
    async list(userId) {
      const rows = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(desc(goals.createdAt));
      return rows.map(toGoal);
    },

    async create(userId, goal) {
      const [row] = await db
        .insert(goals)
        .values({
          id: goal.id,
          userId,
          name: goal.name,
          targetMinor: goal.target.minor,
          targetCurrency: goal.target.currency,
          deadline: goal.deadline,
          linkedAssetIds: goal.linkedAssetIds,
        })
        .returning();
      return toGoal(row!);
    },

    async update(userId, goalId, patch) {
      // Scoped by userId as well as id: RLS is the backstop, not the only lock.
      const [row] = await db
        .update(goals)
        .set({
          ...(patch.name ? { name: patch.name } : {}),
          ...(patch.target ? { targetMinor: patch.target.minor, targetCurrency: patch.target.currency } : {}),
          ...(patch.deadline ? { deadline: patch.deadline } : {}),
          ...(patch.linkedAssetIds ? { linkedAssetIds: patch.linkedAssetIds } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .returning();
      return toGoal(row!);
    },

    async remove(userId, goalId) {
      await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
    },

    async count(userId) {
      const [row] = await db.select({ value: count() }).from(goals).where(eq(goals.userId, userId));
      return row?.value ?? 0;
    },
  };
}
