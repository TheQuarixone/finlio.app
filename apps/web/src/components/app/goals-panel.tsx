"use client";

import { useState } from "react";
import type { Money } from "@finlio/schemas";
import { MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";
import { DEFAULT_INFLATION_PCT, type GoalPlan, formatMoney, formatPercentE4 } from "@finlio/core/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Presentation only. The data comes from the server (`GoalsView`), so this
 * component has no idea where a goal is stored — which is what lets the mobile
 * app reuse the layout decisions without reusing the component.
 */

export interface NewGoal {
  id: string;
  name: string;
  target: Money;
  deadline: string;
}

export function GoalList({
  plans,
  onRemove,
  removingId,
}: {
  plans: readonly GoalPlan[];
  onRemove: (id: string) => void;
  removingId?: string;
}) {
  if (plans.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Your goals</h2>
        <span className="text-xs text-muted-foreground">
          at {DEFAULT_INFLATION_PCT}% inflation
        </span>
      </div>

      <ul className="mt-4 space-y-4">
        {plans.map((plan) => (
          <li key={plan.goalId} className="rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatMoney(plan.inflatedTarget)} by {plan.deadline}
              </p>
              <button
                type="button"
                onClick={() => onRemove(plan.goalId)}
                disabled={removingId === plan.goalId}
                aria-label={`Remove ${plan.name}`}
                className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {removingId === plan.goalId ? "Removing…" : "Remove"}
              </button>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`${formatPercentE4(plan.progressE4)} funded`}
            >
              <div
                className="h-full rounded-full bg-[var(--chart-2)]"
                style={{ width: `${Math.min(100, plan.progressE4 / 10_000)}%` }}
              />
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Funded</dt>
                <dd className="tabular-nums">{formatPercentE4(plan.progressE4)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Months left</dt>
                <dd className="tabular-nums">{plan.monthsRemaining}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Needed each month</dt>
                <dd className="tabular-nums">{formatMoney(plan.monthlyRequired)}</dd>
              </div>
            </dl>

            {plan.unreachable && (
              <p className="mt-3 rounded-lg bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-3 py-2 text-sm text-destructive">
                The deadline has passed and this goal isn&apos;t met. You have two levers:
                put in more each month, or move the date.
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AddGoalForm({
  onAdd,
  busy,
  error,
}: {
  onAdd: (goal: NewGoal) => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAdd({
      id: crypto.randomUUID(),
      name: (fields.name ?? "").trim() || "New goal",
      target: {
        minor: Math.round((Number.parseFloat(fields.target ?? "0") || 0) * MINOR_UNITS_PER_MAJOR),
        currency: "INR",
      },
      deadline: fields.deadline || new Date().toISOString().slice(0, 10),
    });
    setFields({});
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold">Set a goal</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We adjust the target for {DEFAULT_INFLATION_PCT}% annual inflation, so the number
        is what it will actually cost by then.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium">Goal</span>
          <Input
            className="mt-1" required placeholder="Emergency fund"
            value={fields.name ?? ""} onChange={set("name")}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Target today (₹)</span>
          <Input
            className="mt-1" type="number" step="1000" placeholder="600000"
            value={fields.target ?? ""} onChange={set("target")}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">By when</span>
          <Input
            className="mt-1" type="date"
            value={fields.deadline ?? ""} onChange={set("deadline")}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="mt-6">
        {busy ? "Saving…" : "Add goal"}
      </Button>
    </form>
  );
}
