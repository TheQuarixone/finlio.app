import { describe, expect, it, vi } from "vitest";
import type { Goal, SubscriptionTier } from "@finlio/schemas";
import { fixedClock } from "../ports/clock";
import { money } from "../domain/money";
import { ServiceError, type ServiceContext } from "./context";
import { createGoal, planGoals } from "./goal";

/**
 * No database, no mocking library gymnastics — the ports make a fake a plain
 * object. This is the payoff of keeping adapters out of `packages/core`.
 */
function contextWith({
  tier = "free" as SubscriptionTier,
  goals = [] as Goal[],
}) {
  const stored = [...goals];
  const ctx: ServiceContext = {
    userId: "user-1",
    clock: fixedClock("2026-09-01T00:00:00.000Z"),
    profiles: {} as ServiceContext["profiles"],
    snapshots: {} as ServiceContext["snapshots"],
    entitlements: { tierFor: vi.fn(async () => tier) },
    goals: {
      list: async () => stored,
      count: async () => stored.length,
      create: async (_userId, goal) => {
        stored.push(goal);
        return goal;
      },
      update: async () => stored[0]!,
      remove: async () => undefined,
    },
  };
  return { ctx, stored };
}

const input = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "Emergency fund",
  target: money(600_000, "INR"),
  deadline: "2027-12-31",
};

const existing = (n: number): Goal => ({
  id: `3f2504e0-4f89-41d3-9a0c-0305e82c33${String(n).padStart(2, "0")}`,
  name: `Goal ${n}`,
  target: money(100_000, "INR"),
  deadline: "2028-01-01",
  linkedAssetIds: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("createGoal", () => {
  it("creates a goal and stamps the injected clock", async () => {
    const { ctx } = contextWith({});
    const goal = await createGoal(ctx, input);
    expect(goal.createdAt).toBe("2026-09-01T00:00:00.000Z");
    expect(goal.linkedAssetIds).toEqual([]);
  });

  it("stops a free account at three goals", async () => {
    const { ctx } = contextWith({ tier: "free", goals: [existing(1), existing(2), existing(3)] });
    await expect(createGoal(ctx, input)).rejects.toBeInstanceOf(ServiceError);
  });

  it("lets a paid account past the free cap", async () => {
    const { ctx } = contextWith({ tier: "pro", goals: [existing(1), existing(2), existing(3)] });
    await expect(createGoal(ctx, input)).resolves.toMatchObject({ name: "Emergency fund" });
  });

  it("reads the tier from the account, never from the caller", async () => {
    const { ctx } = contextWith({ tier: "free" });
    await createGoal(ctx, input);
    expect(ctx.entitlements.tierFor).toHaveBeenCalledWith("user-1");
  });
});

describe("planGoals", () => {
  it("plans each stored goal against what the caller says is saved", async () => {
    const { ctx } = contextWith({ goals: [existing(1)] });
    const [plan] = await planGoals(ctx, money(50_000, "INR"));
    expect(plan?.name).toBe("Goal 1");
    expect(plan?.monthlyRequired.minor).toBeGreaterThan(0);
  });

  it("returns nothing when there are no goals", async () => {
    const { ctx } = contextWith({});
    await expect(planGoals(ctx, money(50_000, "INR"))).resolves.toEqual([]);
  });
});
