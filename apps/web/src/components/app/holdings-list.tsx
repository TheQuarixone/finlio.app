"use client";

import type { Asset, Liability } from "@finlio/schemas";
import { costBasis, formatMoney } from "@finlio/core/domain";
import { Button } from "@/components/ui/button";

const KIND_LABELS: Record<string, string> = {
  equity: "Stock", mutual_fund: "Mutual fund", fixed_deposit: "FD",
  real_estate: "Property", cash: "Cash", epf: "EPF", ppf: "PPF",
  nps: "NPS", sgb: "SGB", insurance: "Insurance",
};

function describe(asset: Asset): string {
  switch (asset.kind) {
    case "equity":
      return `${asset.qty} × ${formatMoney(asset.avgPrice)} on ${asset.exchange}`;
    case "mutual_fund":
      return `${(asset.unitsE6 / 1_000_000).toFixed(3)} units at ${formatMoney(asset.purchaseNav)}`;
    case "fixed_deposit":
      return `${(asset.ratePctE4 / 10_000).toFixed(2)}% to ${asset.maturityDate}`;
    case "cash":
      return asset.institution;
    default:
      return KIND_LABELS[asset.kind] ?? asset.kind;
  }
}

export function HoldingsList({
  assets, liabilities, onRemoveAsset, onRemoveLiability,
}: {
  assets: readonly Asset[];
  liabilities: readonly Liability[];
  onRemoveAsset: (id: string) => void;
  onRemoveLiability: (id: string) => void;
}) {
  if (assets.length === 0 && liabilities.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Everything you hold</h2>

      {assets.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {assets.map((asset) => {
            const valued = asset.manualValue ?? costBasis(asset);
            return (
              <li key={asset.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{asset.label}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {KIND_LABELS[asset.kind]} · {describe(asset)}
                    {!asset.manualValue && " · at cost"}
                  </p>
                </div>
                <span className="tabular-nums">{formatMoney(valued)}</span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onRemoveAsset(asset.id)}
                  aria-label={`Remove ${asset.label}`}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {liabilities.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-medium text-muted-foreground">Liabilities</h3>
          <ul className="mt-2 divide-y divide-border">
            {liabilities.map((liability) => (
              <li key={liability.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{liability.label}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {liability.lender}
                    {liability.emi && ` · EMI ${formatMoney(liability.emi)}`}
                  </p>
                </div>
                <span className="tabular-nums text-destructive">
                  −{formatMoney(liability.outstanding)}
                </span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onRemoveLiability(liability.id)}
                  aria-label={`Remove ${liability.label}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
