import type { MarketDataProvider, Quote } from "@finlio/core/ports";
import { MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";

/**
 * Adapter over the Finlio market-data service (`services/market-data`), which
 * wraps `jugaad-data` for NSE prices and RBI economic series.
 *
 * `jugaad-data` is a Python library with no TypeScript equivalent — nothing in
 * npm reads RBI's published series — so it runs as its own small HTTP service
 * and this adapter speaks to it. That keeps one Python dependency in one
 * deployable instead of spreading a runtime across the Next app.
 *
 * Everything upstream still sees `MarketDataProvider`, so which of Yahoo, this
 * service, or a licensed vendor is answering is invisible to the net-worth
 * engine.
 */
export interface JugaadConfig {
  /** Base URL of the market-data service. */
  baseUrl: string;
  /** Shared secret; the service is internal and must not be publicly callable. */
  apiKey: string;
  timeoutMs?: number;
}

interface ServiceQuote {
  symbol: string;
  price: number;
  previous_close?: number;
  change_pct?: number;
  as_of: string;
}

export function createJugaadMarketData(config: JugaadConfig): MarketDataProvider {
  const call = async <T>(path: string, body: unknown): Promise<T | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 5_000);
    try {
      const response = await fetch(new URL(path, config.baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": config.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const toQuote = (row: ServiceQuote): Quote => {
    const quote: Quote = {
      symbol: row.symbol,
      price: { minor: Math.round(row.price * MINOR_UNITS_PER_MAJOR), currency: "INR" },
      asOf: row.as_of,
    };
    if (row.previous_close !== undefined) {
      quote.previousClose = {
        minor: Math.round(row.previous_close * MINOR_UNITS_PER_MAJOR),
        currency: "INR",
      };
    }
    if (row.change_pct !== undefined) quote.changePctE4 = Math.round(row.change_pct * 10_000);
    return quote;
  };

  return {
    async quotes(symbols) {
      const found = new Map<string, Quote>();
      if (symbols.length === 0) return found;
      const data = await call<{ quotes: ServiceQuote[] }>("/quotes", { symbols: [...symbols] });
      for (const row of data?.quotes ?? []) found.set(row.symbol, toQuote(row));
      return found;
    },

    async navs(identifiers) {
      const found = new Map<string, Quote>();
      if (identifiers.length === 0) return found;
      const data = await call<{ quotes: ServiceQuote[] }>("/navs", { identifiers: [...identifiers] });
      for (const row of data?.quotes ?? []) found.set(row.symbol, toQuote(row));
      return found;
    },
  };
}
