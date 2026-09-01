import { describe, expect, it } from "vitest";
import { toYahooSymbol } from "@finlio/core/ports";
import { createJugaadMarketData } from "./jugaad";

describe("toYahooSymbol", () => {
  it("suffixes NSE tickers with .NS and BSE with .BO", () => {
    expect(toYahooSymbol("reliance", "NSE")).toBe("RELIANCE.NS");
    expect(toYahooSymbol("reliance", "BSE")).toBe("RELIANCE.BO");
  });

  it("normalises case and whitespace, so a US namesake is never hit by accident", () => {
    expect(toYahooSymbol("  infy ", "NSE")).toBe("INFY.NS");
  });
});

describe("createJugaadMarketData", () => {
  const provider = createJugaadMarketData({ baseUrl: "http://127.0.0.1:9/", apiKey: "k" });

  it("returns an empty map for no symbols without calling out", async () => {
    expect(await provider.quotes([])).toEqual(new Map());
  });

  it("degrades to empty when the service is unreachable, never throws", async () => {
    // The dashboard must fall back to cost basis when a feed is down.
    await expect(provider.quotes(["RELIANCE"])).resolves.toEqual(new Map());
  });
});
