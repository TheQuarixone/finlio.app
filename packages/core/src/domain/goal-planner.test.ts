import { describe, expect, it } from "vitest";
import type { Goal } from "@finlio/schemas";
import { DEFAULT_INFLATION_PCT, monthlySurplus, monthsBetween, planGoal } from "./goal-planner";
import { money, zero } from "./money";

const now = new Date("2026-09-01T00:00:00.000Z");

const goal = (deadline: string, target: number): Goal => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "Emergency fund",
  target: money(target, "INR"),
  deadline,
  linkedAssetIds: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("monthsBetween", () => {
  it("counts whole months forward", () => {
    expect(monthsBetween(now, new Date("2027-09-01T00:00:00.000Z"))).toBe(12);
  });

  it("floors a past deadline at zero instead of going negative", () => {
    expect(monthsBetween(now, new Date("2025-09-01T00:00:00.000Z"))).toBe(0);
  });
});

describe("planGoal", () => {
  it("inflates the target at 6% a year by default", () => {
    const plan = planGoal({ goal: goal("2031-09-01", 1_000_000), saved: zero("INR"), now });
    expect(DEFAULT_INFLATION_PCT).toBe(6);
    // 1,000,000 × 1.06^5 ≈ 1,338,226
    expect(plan.inflatedTarget.minor).toBe(133_822_558);
  });

  it("divides the shortfall across the months remaining", () => {
    const plan = planGoal({ goal: goal("2027-09-01", 120_000), saved: zero("INR"), now });
    expect(plan.monthsRemaining).toBe(12);
    expect(plan.monthlyRequired.minor).toBe(Math.ceil(plan.shortfall.minor / 12));
  });

  it("asks for nothing once the goal is already funded", () => {
    const plan = planGoal({ goal: goal("2027-09-01", 100_000), saved: money(500_000, "INR"), now });
    expect(plan.shortfall).toEqual(zero("INR"));
    expect(plan.monthlyRequired).toEqual(zero("INR"));
    expect(plan.unreachable).toBe(false);
  });

  it("flags an unmet goal whose deadline has passed instead of quoting an absurd number", () => {
    const plan = planGoal({ goal: goal("2025-01-01", 500_000), saved: money(10_000, "INR"), now });
    expect(plan.monthsRemaining).toBe(0);
    expect(plan.unreachable).toBe(true);
    expect(plan.monthlyRequired).toEqual(zero("INR"));
  });

  it("caps progress at 100% when overfunded", () => {
    const plan = planGoal({ goal: goal("2027-09-01", 100_000), saved: money(900_000, "INR"), now });
    expect(plan.progressE4).toBe(1_000_000);
  });

  it("honours a non-default inflation assumption", () => {
    const flat = planGoal({ goal: goal("2031-09-01", 1_000_000), saved: zero("INR"), now, inflationPct: 0 });
    expect(flat.inflatedTarget).toEqual(money(1_000_000, "INR"));
  });
});

describe("monthlySurplus", () => {
  it("is monthly income minus monthly expenses", () => {
    expect(monthlySurplus(money(1_800_000, "INR"), money(55_000, "INR"))).toEqual(
      money(95_000, "INR")
    );
  });

  it("can be negative when expenses outrun income", () => {
    expect(monthlySurplus(money(600_000, "INR"), money(80_000, "INR")).minor).toBeLessThan(0);
  });
});
