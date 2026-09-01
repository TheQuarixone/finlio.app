import type { Asset, AssetKind, CurrencyCode, Liability, Money } from "@finlio/schemas";
import { add, percentE4, subtract, sum, zero } from "./money";
import { manualValuation, type ValuationProvider } from "./valuation";

export interface AllocationSlice {
  kind: AssetKind;
  value: Money;
  /** Share of total assets, percent × 1e4. */
  shareE4: number;
}

export interface NetWorth {
  currency: CurrencyCode;
  totalAssets: Money;
  totalLiabilities: Money;
  netWorth: Money;
  /** Descending by value, so the dashboard can render it as-is. */
  allocation: AllocationSlice[];
  assetCount: number;
  liabilityCount: number;
}

export interface NetWorthInput {
  assets: readonly Asset[];
  liabilities: readonly Liability[];
  baseCurrency: CurrencyCode;
  valuation?: ValuationProvider;
}

/**
 * Net worth = what you own − what you owe (PRD NW-1).
 *
 * Deliberately total: an empty portfolio is ₹0, not an error, because the
 * dashboard's first render is always empty and an exception there would be a
 * silly way to fail. Anything not in `baseCurrency` is skipped rather than
 * wrongly added — multi-currency needs live FX and is Phase 4 (NRI mode), and
 * silently summing SGD into an INR total would be worse than omitting it.
 */
export function computeNetWorth({
  assets,
  liabilities,
  baseCurrency,
  valuation = manualValuation,
}: NetWorthInput): NetWorth {
  const valued = assets
    .map((asset) => ({ asset, value: valuation.value(asset) }))
    .filter(({ value }) => value.currency === baseCurrency);

  const owed = liabilities.filter((l) => l.outstanding.currency === baseCurrency);

  const totalAssets = sum(
    valued.map(({ value }) => value),
    baseCurrency
  );
  const totalLiabilities = sum(
    owed.map((l) => l.outstanding),
    baseCurrency
  );

  const byKind = new Map<AssetKind, Money>();
  for (const { asset, value } of valued) {
    const running = byKind.get(asset.kind) ?? zero(baseCurrency);
    byKind.set(asset.kind, add(running, value));
  }

  const allocation: AllocationSlice[] = [...byKind.entries()]
    .map(([kind, value]) => ({ kind, value, shareE4: percentE4(value, totalAssets) }))
    .sort((a, b) => b.value.minor - a.value.minor);

  return {
    currency: baseCurrency,
    totalAssets,
    totalLiabilities,
    netWorth: subtract(totalAssets, totalLiabilities),
    allocation,
    assetCount: valued.length,
    liabilityCount: owed.length,
  };
}
