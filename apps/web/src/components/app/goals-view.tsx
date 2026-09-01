"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { computeNetWorth } from "@finlio/core/domain";
import { useTRPC } from "@/lib/trpc/client";
import { useDocument } from "./use-document";
import { AddGoalForm, GoalList, type NewGoal } from "./goals-panel";

/**
 * Goals live on the server; holdings live on the device. This screen is where
 * the two meet.
 *
 * Goal metadata is a name, a number and a date — nothing that identifies a
 * holding — so it goes to Postgres, where the Phase-3 Goal Coach can reach it.
 * That agent runs on a schedule with no access to anybody's browser, so a goal
 * kept only on-device would be invisible to it.
 *
 * What the server cannot know is how much is saved: that is the user's
 * portfolio, which never leaves the device (ADR-0004). So the client computes
 * `saved` from the local document and passes it in, and the server plans
 * against it. Neither side holds the whole picture, which is the point.
 */
export function GoalsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { doc, loading: documentLoading } = useDocument();

  const saved = useMemo(
    () =>
      computeNetWorth({
        assets: doc.assets,
        liabilities: doc.liabilities,
        baseCurrency: doc.meta.baseCurrency,
      }).totalAssets,
    [doc]
  );

  const plans = useQuery({
    ...trpc.goal.plan.queryOptions({ saved }),
    // Planning needs the on-device total, so don't ask until it is loaded —
    // otherwise the first result is computed against ₹0 and flickers.
    enabled: !documentLoading,
    /**
     * Set here and not only in the QueryClient defaults, because this is the
     * behaviour the screen depends on being true.
     *
     * React Query's default pauses a query whenever its `onlineManager`
     * believes the browser is offline, and a paused query stays
     * `status: "pending"` forever — an endless skeleton with no error. That
     * manager can be wrong: it latches on `offline` events, so a momentary
     * blip leaves it stuck even while `navigator.onLine` is true and requests
     * plainly succeed.
     */
    networkMode: "always",
    /**
     * No automatic retry. The first request already failed and the user is
     * watching the screen: a scheduled retry keeps the query `pending` while it
     * waits, and if React Query's online manager has latched offline that retry
     * is paused indefinitely — the skeleton never resolves and no error is ever
     * shown. Failing immediately with a "Try again" button puts the decision
     * where it belongs.
     */
    retry: false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.goal.pathKey() });

  const create = useMutation(
    trpc.goal.create.mutationOptions({ onSuccess: invalidate })
  );
  const remove = useMutation(
    trpc.goal.remove.mutationOptions({ onSuccess: invalidate })
  );

  function addGoal(goal: NewGoal) {
    create.mutate(goal);
  }

  // A paused query reports `pending` indefinitely, so it must never be treated
  // as loading — that is how a skeleton becomes permanent. `networkMode:
  // "always"` should prevent it; this makes the screen correct even if it does.
  const paused = plans.fetchStatus === "paused";

  if (documentLoading || (plans.isPending && !paused)) {
    return <div className="h-72 max-w-4xl animate-pulse rounded-3xl bg-muted/60" />;
  }

  if (plans.isError || paused) {
    return (
      <div className="max-w-4xl rounded-3xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Goals aren&apos;t available right now</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your holdings are safe — they live on this device and don&apos;t depend on our
          servers. Goals are stored on your account, and we couldn&apos;t reach it.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {paused ? "Your browser reports no network connection." : plans.error?.message}
        </p>
        <button
          type="button"
          onClick={() => plans.refetch()}
          className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Try again
        </button>
      </div>
    );
  }

  // Narrowing past the paused branch no longer proves `data` is set; an empty
  // list is the right reading of "settled with nothing".
  const goalPlans = plans.data ?? [];

  return (
    <div className="max-w-4xl space-y-5">
      {goalPlans.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">No goals yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Name something you&apos;re saving for and we&apos;ll work out what it takes
            each month to get there.
          </p>
        </div>
      )}

      <GoalList
        plans={goalPlans}
        onRemove={(id) => remove.mutate({ id })}
        removingId={remove.isPending ? remove.variables?.id : undefined}
      />

      <AddGoalForm
        onAdd={addGoal}
        busy={create.isPending}
        error={create.error?.message ?? null}
      />
    </div>
  );
}
