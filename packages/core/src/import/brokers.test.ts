import { describe, expect, it } from "vitest";
import type { Asset } from "@finlio/schemas";
import { applyMerge, detectBroker, parseHoldings, planMerge } from "./brokers";

const now = new Date("2026-09-01T10:00:00.000Z");
let seq = 0;
const opts = { now, makeId: () => `id-${(seq += 1)}` };
const fresh = () => {
  seq = 0;
  return opts;
};

const ZERODHA_CSV = [
  "Holdings",
  "Client: AB1234",
  "",
  "Symbol,ISIN,Quantity,Average Price,Previous Closing",
  "RELIANCE,INE002A01018,20,2850.00,2910.55",
  '"TATAMOTORS",INE155A01022,15,"1,024.50",998.10',
  "INFY,INE009A01021,8,-,1450.00",
].join("\n");

const GROWW_CSV = [
  "Stock Name,ISIN,Quantity,Average Buy Price",
  "HDFC Bank,INE040A01034,12,1620.75",
  "Total,,,",
].join("\n");

describe("detectBroker", () => {
  it("recognises a Zerodha export", () => {
    expect(detectBroker(ZERODHA_CSV)).toBe("zerodha");
  });

  it("recognises a Groww export", () => {
    expect(detectBroker(GROWW_CSV)).toBe("groww");
  });

  it("returns null for something else, rather than guessing", () => {
    // Guessing would mis-map columns and import wrong numbers silently.
    expect(detectBroker("date,amount\n2026-01-01,500")).toBeNull();
  });
});

describe("parseHoldings — Zerodha", () => {
  it("reads holdings past the preamble", () => {
    const result = parseHoldings(ZERODHA_CSV, "zerodha", fresh());
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]?.asset).toMatchObject({
      kind: "equity", ticker: "RELIANCE", qty: 20,
      avgPrice: { minor: 285_000, currency: "INR" },
    });
  });

  it("reads a quoted, comma-separated price correctly", () => {
    const result = parseHoldings(ZERODHA_CSV, "zerodha", fresh());
    // "1,024.50" must be ₹1024.50, not ₹1.
    expect(result.rows[1]?.asset).toMatchObject({ ticker: "TATAMOTORS", qty: 15 });
    expect((result.rows[1]?.asset as { avgPrice: { minor: number } }).avgPrice.minor).toBe(102_450);
  });

  it("keeps a holding with no cost basis instead of dropping it", () => {
    // Dropping it would silently understate net worth.
    const result = parseHoldings(ZERODHA_CSV, "zerodha", fresh());
    const infy = result.rows.find((r) => r.asset.label === "INFY");
    expect(infy).toBeDefined();
    expect((infy?.asset as { avgPrice: { minor: number } }).avgPrice.minor).toBe(0);
  });
});

describe("parseHoldings — Groww", () => {
  it("reads holdings and reports the totals row as skipped", () => {
    const result = parseHoldings(GROWW_CSV, "groww", fresh());
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.asset).toMatchObject({ ticker: "HDFC BANK", qty: 12 });
    // Surfaced, never silently swallowed.
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.reason).toMatch(/quantity/i);
  });
});

describe("parseHoldings — malformed input", () => {
  it("explains itself when the file is not a holdings export", () => {
    const result = parseHoldings("date,amount\n2026-01-01,500", "zerodha", fresh());
    expect(result.rows).toEqual([]);
    expect(result.skipped[0]?.reason).toMatch(/doesn't look like a Zerodha/);
  });

  it("survives an empty file", () => {
    const result = parseHoldings("", "zerodha", fresh());
    expect(result.rows).toEqual([]);
    expect(result.skipped).toHaveLength(1);
  });

  it("skips a row with a zero quantity and says why", () => {
    const csv = "Symbol,Quantity,Average Price\nRELIANCE,0,2850";
    const result = parseHoldings(csv, "zerodha", fresh());
    expect(result.rows).toEqual([]);
    expect(result.skipped[0]?.reason).toContain("RELIANCE");
  });
});

const equity = (id: string, ticker: string, qty: number, price: number): Asset => ({
  id, label: ticker, updatedAt: now.toISOString(), kind: "equity",
  ticker, exchange: "NSE", qty, avgPrice: { minor: price * 100, currency: "INR" },
});

describe("planMerge", () => {
  it("adds holdings that are new", () => {
    const plan = planMerge([], [equity("i1", "RELIANCE", 20, 2850)]);
    expect(plan.added).toHaveLength(1);
  });

  it("updates a position rather than duplicating it on re-import", () => {
    // Re-importing monthly is normal. A duplicate would double net worth.
    const plan = planMerge(
      [equity("existing", "RELIANCE", 20, 2850)],
      [equity("new", "RELIANCE", 25, 2860)]
    );
    expect(plan.added).toEqual([]);
    expect(plan.updated).toHaveLength(1);
  });

  it("reports an identical row as unchanged", () => {
    const plan = planMerge(
      [equity("existing", "RELIANCE", 20, 2850)],
      [equity("new", "RELIANCE", 20, 2850)]
    );
    expect(plan.unchanged).toHaveLength(1);
    expect(plan.updated).toEqual([]);
  });

  it("matches tickers case-insensitively", () => {
    const plan = planMerge(
      [equity("existing", "reliance", 20, 2850)],
      [equity("new", "RELIANCE", 30, 2850)]
    );
    expect(plan.updated).toHaveLength(1);
  });
});

describe("applyMerge", () => {
  it("keeps the stored id when updating, so nothing else breaks", () => {
    const existing = [equity("existing", "RELIANCE", 20, 2850)];
    const plan = planMerge(existing, [equity("incoming", "RELIANCE", 25, 2860)]);
    const merged = applyMerge(existing, plan);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("existing");
    expect(merged[0]).toMatchObject({ qty: 25 });
  });

  it("leaves untouched holdings alone", () => {
    const existing = [equity("a", "RELIANCE", 20, 2850), equity("b", "INFY", 5, 1400)];
    const plan = planMerge(existing, [equity("c", "RELIANCE", 25, 2850)]);
    const merged = applyMerge(existing, plan);

    expect(merged).toHaveLength(2);
    expect(merged.find((a) => a.id === "b")).toMatchObject({ qty: 5 });
  });
});
