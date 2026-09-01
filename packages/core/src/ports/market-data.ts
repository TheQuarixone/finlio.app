import type { Money } from "@finlio/schemas";

export interface Quote {
  symbol: string;
  price: Money;
  /** Previous close, when the provider reports it — used for the day's move. */
  previousClose?: Money;
  /** Change on the day, percent × 1e4. */
  changePctE4?: number;
  asOf: string;
  /** True when the figure came from a cache or a stale session. */
  stale?: boolean;
}

/**
 * Live valuation input (PRD IN-1/IN-2/IN-4).
 *
 * A port, not a vendor: the market-data provider is still an open question
 * (PRD §14) and the licensing position on each candidate differs. Everything
 * upstream — the valuation provider, the net-worth engine, the dashboard —
 * depends on this interface, so swapping vendors is one adapter.
 *
 * Implementations must be resilient by contract: a missing quote returns
 * `undefined` rather than throwing, because a market feed being down must
 * degrade the dashboard to cost basis, never break it.
 */
export interface MarketDataProvider {
  /** Equity quotes. Symbols are provider-native (e.g. "RELIANCE.NS"). */
  quotes(symbols: readonly string[]): Promise<Map<string, Quote>>;
  /** Mutual-fund NAV by ISIN or scheme code, where the provider supports it. */
  navs?(identifiers: readonly string[]): Promise<Map<string, Quote>>;
}

/**
 * Yahoo's symbol convention for Indian exchanges: NSE is `.NS`, BSE is `.BO`.
 * Kept next to the port because every adapter over Yahoo-shaped data needs it,
 * and because getting it wrong silently returns a US-listed namesake.
 */
export function toYahooSymbol(ticker: string, exchange: "NSE" | "BSE"): string {
  return `${ticker.trim().toUpperCase()}${exchange === "NSE" ? ".NS" : ".BO"}`;
}
