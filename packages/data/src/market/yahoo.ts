import yahooFinance from "yahoo-finance2";
import type { MarketDataProvider, Quote } from "@finlio/core/ports";
import { MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";

/**
 * Yahoo Finance adapter (`yahoo-finance2`, the maintained TypeScript client for
 * the endpoints Python's `yfinance` wraps).
 *
 * Covers NSE (`.NS`) and BSE (`.BO`) equities, indices, and FX. It does not
 * cover Indian mutual-fund NAVs usefully — AMFI's daily file is the source for
 * those — so `navs` is deliberately absent here and served by another adapter.
 *
 * Licensing: Yahoo's data is not licensed for commercial redistribution, and
 * `yfinance`'s own documentation positions it as research/personal use. It is
 * the right choice for development and for proving the seam; the production
 * provider is still an open question (PRD §14) and the port exists so that
 * answer costs one adapter, not a refactor.
 */
interface YahooQuoteRow {
  symbol?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: Date | number;
}

export function createYahooMarketData(): MarketDataProvider {
  return {
    async quotes(symbols) {
      const found = new Map<string, Quote>();
      if (symbols.length === 0) return found;

      let results: unknown;
      try {
        results = await yahooFinance.quote([...symbols]);
      } catch {
        // Contract: a market feed being down degrades the dashboard to cost
        // basis. It never breaks it.
        return found;
      }

      // The SDK's overloads collapse to `never` when the argument type isn't a
      // literal, so the handful of fields actually used are named here instead.
      const rows = (Array.isArray(results) ? results : [results]) as YahooQuoteRow[];
      for (const row of rows) {
        if (!row?.symbol || typeof row.regularMarketPrice !== "number") continue;
        const currency = row.currency === "INR" ? "INR" : "INR";
        const quote: Quote = {
          symbol: row.symbol,
          price: { minor: Math.round(row.regularMarketPrice * MINOR_UNITS_PER_MAJOR), currency },
          asOf: new Date((row.regularMarketTime?.valueOf() ?? Date.now())).toISOString(),
        };
        if (typeof row.regularMarketPreviousClose === "number") {
          quote.previousClose = {
            minor: Math.round(row.regularMarketPreviousClose * MINOR_UNITS_PER_MAJOR),
            currency,
          };
        }
        if (typeof row.regularMarketChangePercent === "number") {
          quote.changePctE4 = Math.round(row.regularMarketChangePercent * 10_000);
        }
        found.set(row.symbol, quote);
      }
      return found;
    },
  };
}
