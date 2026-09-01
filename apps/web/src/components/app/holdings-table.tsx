"use client";

import type { Asset, Liability } from "@finlio/schemas";
import { costBasis, formatMoney } from "@finlio/core/domain";
import { KIND_LABELS } from "./allocation-donut";

/**
 * Holdings as a table on desktop, stacked rows on mobile.
 *
 * The "Valued" column is doing quiet but important work: it says whether a
 * number is what the user told us or a fallback to what they paid. Showing a
 * cost-basis figure as though it were today's value would be the dashboard
 * lying, so it is labelled rather than hidden.
 */

function Pill({ tone, children }: { tone: "live" | "cost" | "owed"; children: React.ReactNode }) {
  const styles = {
    live: "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[color-mix(in_oklab,var(--chart-2)_75%,black)]",
    cost: "bg-muted text-muted-foreground",
    owed: "bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)] text-[color-mix(in_oklab,var(--destructive)_80%,black)]",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

function detail(asset: Asset): string {
  switch (asset.kind) {
    case "equity":
      return `${asset.qty} × ${formatMoney(asset.avgPrice)} · ${asset.exchange}`;
    case "mutual_fund":
      return `${(asset.unitsE6 / 1_000_000).toFixed(3)} units · NAV ${formatMoney(asset.purchaseNav)}`;
    case "fixed_deposit":
      return `${(asset.ratePctE4 / 10_000).toFixed(2)}% · matures ${asset.maturityDate}`;
    case "cash":
      return asset.institution;
    default:
      return KIND_LABELS[asset.kind] ?? asset.kind;
  }
}

export function HoldingsTable({
  assets,
  liabilities,
  onRemoveAsset,
  onRemoveLiability,
}: {
  assets: readonly Asset[];
  liabilities: readonly Liability[];
  onRemoveAsset: (id: string) => void;
  onRemoveLiability: (id: string) => void;
}) {
  if (assets.length === 0 && liabilities.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold">Everything you hold</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="pb-3 pr-4 font-medium">Holding</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Type</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Valued</th>
              <th scope="col" className="pb-3 pr-4 text-right font-medium">Amount</th>
              <th scope="col" className="pb-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-border">
                <td className="py-3 pr-4">
                  <p className="font-medium">{asset.label}</p>
                  <p className="text-xs text-muted-foreground">{detail(asset)}</p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {KIND_LABELS[asset.kind] ?? asset.kind}
                </td>
                <td className="py-3 pr-4">
                  {asset.manualValue ? <Pill tone="live">Your value</Pill> : <Pill tone="cost">At cost</Pill>}
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums">
                  {formatMoney(asset.manualValue ?? costBasis(asset))}
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveAsset(asset.id)}
                    aria-label={`Remove ${asset.label}`}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {liabilities.map((liability) => (
              <tr key={liability.id} className="border-t border-border">
                <td className="py-3 pr-4">
                  <p className="font-medium">{liability.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {liability.lender}
                    {liability.emi && ` · EMI ${formatMoney(liability.emi)}`}
                  </p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">Liability</td>
                <td className="py-3 pr-4"><Pill tone="owed">Owed</Pill></td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums text-destructive">
                  −{formatMoney(liability.outstanding)}
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveLiability(liability.id)}
                    aria-label={`Remove ${liability.label}`}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
