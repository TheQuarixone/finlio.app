import type { CurrencyCode, Goal, Money } from "@finlio/schemas";
import { money, subtract, zero } from "./money";

/**
 * PRD §6.5 GO-2. Default inflation for INR goals is 6% — a product decision,
 * not a market observation, and it is stated everywhere the number appears.
 */
export const DEFAULT_INFLATION_PCT = 6;

export interface GoalPlan {
  goalId: string;
  name: string;
  /** Carried through so a caller rendering a plan needs no second lookup. */
  deadline: string;
  /** Target restated in the money of the deadline year. */
  inflatedTarget: Money;
  /** Already earmarked toward it. */
  saved: Money;
  shortfall: Money;
  monthsRemaining: number;
  /** What must go in each month from now. Zero once the goal is met. */
  monthlyRequired: Money;
  progressE4: number;
  /**
   * True when the deadline has passed or is this month and the goal is unmet.
   * PRD Appendix B asks the coach to say so honestly rather than quote an
   * absurd monthly number.
   */
  unreachable: boolean;
}

export interface PlanGoalInput {
  goal: Goal;
  saved: Money;
  /** Injected so tests are deterministic — never `new Date()` inside domain code. */
  now: Date;
  inflationPct?: number;
}

/** Whole months from `now` to `deadline`, floored at 0. */
export function monthsBetween(now: Date, deadline: Date): number {
  const months =
    (deadline.getUTCFullYear() - now.getUTCFullYear()) * 12 +
    (deadline.getUTCMonth() - now.getUTCMonth());
  return Math.max(0, months);
}

export function planGoal({
  goal,
  saved,
  now,
  inflationPct = DEFAULT_INFLATION_PCT,
}: PlanGoalInput): GoalPlan {
  const currency: CurrencyCode = goal.target.currency;
  const deadline = new Date(`${goal.deadline}T00:00:00.000Z`);
  const monthsRemaining = monthsBetween(now, deadline);
  const years = monthsRemaining / 12;

  const inflatedMinor = Math.round(
    goal.target.minor * Math.pow(1 + inflationPct / 100, years)
  );
  const inflatedTarget: Money = { minor: inflatedMinor, currency };

  const shortfallMinor = Math.max(0, inflatedMinor - saved.minor);
  const shortfall: Money = { minor: shortfallMinor, currency };

  const met = shortfallMinor === 0;
  const unreachable = !met && monthsRemaining === 0;

  const monthlyRequired: Money =
    met || monthsRemaining === 0
      ? zero(currency)
      : { minor: Math.ceil(shortfallMinor / monthsRemaining), currency };

  const progressE4 =
    inflatedMinor === 0
      ? 1_000_000
      : Math.min(1_000_000, Math.round((saved.minor / inflatedMinor) * 100 * 10_000));

  return {
    goalId: goal.id,
    name: goal.name,
    deadline: goal.deadline,
    inflatedTarget,
    saved,
    shortfall,
    monthsRemaining,
    monthlyRequired,
    progressE4,
    unreachable,
  };
}

/** Monthly surplus available to fund goals: income/12 − expenses. */
export function monthlySurplus(annualIncome?: Money, monthlyExpenses?: Money): Money {
  const currency = annualIncome?.currency ?? monthlyExpenses?.currency ?? "INR";
  if (!annualIncome) return monthlyExpenses ? zero(currency) : money(0, currency);
  const monthlyIncome: Money = {
    minor: Math.round(annualIncome.minor / 12),
    currency: annualIncome.currency,
  };
  return monthlyExpenses ? subtract(monthlyIncome, monthlyExpenses) : monthlyIncome;
}
