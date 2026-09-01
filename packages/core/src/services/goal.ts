import { FREE_TIER_GOAL_LIMIT, type Goal } from "@finlio/schemas";
import type { Money } from "@finlio/schemas";
import { planGoal, type GoalPlan } from "../domain/goal-planner";
import { ServiceError, type ServiceContext } from "./context";

export async function listGoals(ctx: ServiceContext): Promise<Goal[]> {
  return ctx.goals.list(ctx.userId);
}

export interface CreateGoalInput {
  id: string;
  name: string;
  target: Money;
  deadline: string;
  linkedAssetIds?: string[];
}

/**
 * The Free-tier cap is enforced here, not in the form.
 *
 * A client-side limit is a suggestion; this is the only place that can actually
 * hold the line, and it reads the tier from the account rather than from
 * anything the caller sent (architecture §4.6).
 */
export async function createGoal(ctx: ServiceContext, input: CreateGoalInput): Promise<Goal> {
  const tier = await ctx.entitlements.tierFor(ctx.userId);

  if (tier === "free") {
    const existing = await ctx.goals.count(ctx.userId);
    if (existing >= FREE_TIER_GOAL_LIMIT) {
      throw new ServiceError(
        "limit_reached",
        `Free accounts can track ${FREE_TIER_GOAL_LIMIT} goals. Upgrade to add more.`
      );
    }
  }

  const now = ctx.clock.now().toISOString();
  return ctx.goals.create(ctx.userId, {
    id: input.id,
    name: input.name,
    target: input.target,
    deadline: input.deadline,
    linkedAssetIds: input.linkedAssetIds ?? [],
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteGoal(ctx: ServiceContext, goalId: string): Promise<void> {
  await ctx.goals.remove(ctx.userId, goalId);
}

/**
 * Plan every goal against what the user has saved.
 *
 * `saved` comes from the caller because the holdings that back it live on the
 * device — the server cannot compute this, by design (ADR-0004).
 */
export async function planGoals(ctx: ServiceContext, saved: Money): Promise<GoalPlan[]> {
  const goals = await ctx.goals.list(ctx.userId);
  return goals.map((goal) => planGoal({ goal, saved, now: ctx.clock.now() }));
}
