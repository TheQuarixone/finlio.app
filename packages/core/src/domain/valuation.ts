import type { Asset, Money } from "@finlio/schemas";
import { UNITS_SCALE } from "@finlio/schemas";
import { multiply, multiplyScaled, zero } from "./money";

/**
 * How an asset is turned into a number.
 *
 * Phase 2 ships `manualValuation` only — the user tells us what things are
 * worth. A live-price provider (NSE/BSE quotes, MF NAV, gold) implements the
 * same interface in Phase 3, so the net-worth engine never learns that prices
 * became live.
 */
export interface ValuationProvider {
  value(asset: Asset): Money;
}

/**
 * Cost basis, used when the user hasn't given a current value. It is honest
 * rather than clever: showing purchase price is better than inventing a
 * valuation, and the dashboard labels it.
 */
export function costBasis(asset: Asset): Money {
  switch (asset.kind) {
    case "equity":
      return multiply(asset.avgPrice, asset.qty);
    case "mutual_fund":
      return multiplyScaled(asset.purchaseNav, asset.unitsE6, UNITS_SCALE);
    case "fixed_deposit":
      return asset.principal;
    case "real_estate":
      return asset.estimatedValue;
    case "cash":
      return asset.balance;
    case "epf":
    case "ppf":
    case "nps":
      return asset.balance;
    case "sgb":
      return asset.purchasePrice;
    case "insurance":
      /**
       * Insurance is the one class that is usually NOT net worth. A term or
       * health policy has a payout, not a value you own today. Only a policy
       * with a stated surrender value counts, and even then only that amount —
       * counting the sum assured would overstate net worth enormously.
       */
      return asset.surrenderValue ?? zero(asset.cover.currency);
  }
}

/** The Phase-2 provider: whatever the user entered, else cost basis. */
export const manualValuation: ValuationProvider = {
  value: (asset) => asset.manualValue ?? costBasis(asset),
};
