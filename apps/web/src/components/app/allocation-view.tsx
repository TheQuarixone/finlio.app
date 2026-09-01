"use client";

import { useMemo } from "react";
import { computeNetWorth, costBasis, formatMoney, formatPercentE4 } from "@finlio/core/domain";
import { useDocument } from "./use-document";
import { AllocationDonut, AllocationLegend, KIND_LABELS, toDonutData } from "./allocation-donut";

/**
 * Allocation in detail: the ring, then every holding inside each class.
 *
 * The dashboard shows the split; this page answers "what is actually in that
 * 52%", which is the question the ring provokes and cannot answer.
 */
export function AllocationView() {
  const { doc, loading } = useDocument();

  const netWorth = useMemo(
    () =>
      computeNetWorth({
        assets: doc.assets,
        liabilities: doc.liabilities,
        baseCurrency: doc.meta.baseCurrency,
      }),
    [doc]
  );

  const donut = useMemo(() => toDonutData(netWorth.allocation), [netWorth.allocation]);

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-muted/60" />;

  if (netWorth.allocation.length === 0) {
    return (
      <div className="max-w-3xl rounded-3xl border border-dashed border-border p-10 text-center">
        <p className="font-medium">No allocation to show</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Add a holding and your split across asset classes appears here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="h-fit rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold">Split by class</h2>
        <div className="mt-5">
          <AllocationDonut data={donut} total={netWorth.totalAssets} />
        </div>
        <AllocationLegend data={donut} />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold">What&apos;s inside each class</h2>

        <div className="mt-4 space-y-6">
          {netWorth.allocation.map((slice) => {
            const inClass = doc.assets.filter((asset) => asset.kind === slice.kind);
            return (
              <div key={slice.kind}>
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                  <h3 className="text-sm font-medium">
                    {KIND_LABELS[slice.kind] ?? slice.kind}
                  </h3>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {formatPercentE4(slice.shareE4)} · {formatMoney(slice.value)}
                  </p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {inClass.map((asset) => (
                    <li key={asset.id} className="flex items-baseline gap-3 text-sm">
                      <span className="flex-1 truncate">{asset.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(asset.manualValue ?? costBasis(asset))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
