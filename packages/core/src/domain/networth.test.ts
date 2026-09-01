import { describe, expect, it } from "vitest";
import type { Asset, Liability } from "@finlio/schemas";
import { computeNetWorth } from "./networth";
import { money, zero } from "./money";

const at = "2026-09-01T10:00:00.000Z";
const id = (n: number) => `3f2504e0-4f89-41d3-9a0c-0305e82c33${String(n).padStart(2, "0")}`;

const equity = (n: number, qty: number, price: number): Asset => ({
  id: id(n), label: `Holding ${n}`, updatedAt: at,
  kind: "equity", ticker: "TEST", exchange: "NSE", qty, avgPrice: money(price, "INR"),
});

const cash = (n: number, balance: number): Asset => ({
  id: id(n), label: "Savings", updatedAt: at,
  kind: "cash", institution: "HDFC", balance: money(balance, "INR"),
});

const loan = (n: number, outstanding: number): Liability => ({
  id: id(n), kind: "home_loan", label: "Home loan", lender: "SBI",
  outstanding: money(outstanding, "INR"), updatedAt: at,
});

describe("computeNetWorth", () => {
  it("is zero for an empty portfolio rather than throwing", () => {
    const result = computeNetWorth({ assets: [], liabilities: [], baseCurrency: "INR" });
    expect(result.netWorth).toEqual(zero("INR"));
    expect(result.allocation).toEqual([]);
  });

  it("subtracts what you owe from what you own", () => {
    const result = computeNetWorth({
      assets: [equity(1, 20, 2850), cash(2, 250_000)],
      liabilities: [loan(3, 1_800_000)],
      baseCurrency: "INR",
    });
    // 20 × 2850 = 57,000 + 250,000 = 307,000 assets; 1,800,000 owed
    expect(result.totalAssets).toEqual(money(307_000, "INR"));
    expect(result.totalLiabilities).toEqual(money(1_800_000, "INR"));
    expect(result.netWorth).toEqual(money(-1_493_000, "INR"));
  });

  it("reports a negative net worth honestly", () => {
    const result = computeNetWorth({
      assets: [cash(1, 10_000)], liabilities: [loan(2, 500_000)], baseCurrency: "INR",
    });
    expect(result.netWorth.minor).toBeLessThan(0);
  });

  it("groups allocation by asset class, largest first, with shares summing to 100%", () => {
    const result = computeNetWorth({
      assets: [equity(1, 10, 1000), equity(2, 10, 2000), cash(3, 10_000)],
      liabilities: [], baseCurrency: "INR",
    });
    expect(result.allocation.map((s) => s.kind)).toEqual(["equity", "cash"]);
    expect(result.allocation[0]?.value).toEqual(money(30_000, "INR"));
    const total = result.allocation.reduce((acc, s) => acc + s.shareE4, 0);
    expect(total).toBe(1_000_000);
  });

  it("skips holdings in another currency rather than adding them wrongly", () => {
    const usd: Asset = {
      id: id(9), label: "Schwab", updatedAt: at,
      kind: "cash", institution: "Schwab", balance: money(1000, "USD"),
    };
    const result = computeNetWorth({
      assets: [cash(1, 50_000), usd], liabilities: [], baseCurrency: "INR",
    });
    expect(result.totalAssets).toEqual(money(50_000, "INR"));
    expect(result.assetCount).toBe(1);
  });

  it("prefers the user's own valuation over cost basis", () => {
    const held: Asset = { ...equity(1, 20, 2850), manualValue: money(80_000, "INR") };
    const result = computeNetWorth({ assets: [held], liabilities: [], baseCurrency: "INR" });
    expect(result.totalAssets).toEqual(money(80_000, "INR"));
  });

  it("excludes a term policy from net worth — a payout is not an asset you hold", () => {
    const term: Asset = {
      id: id(1), label: "HDFC Click 2 Protect", updatedAt: at,
      kind: "insurance", policyType: "term", insurer: "HDFC Life",
      cover: money(10_000_000, "INR"), annualPremium: money(18_000, "INR"),
    };
    const result = computeNetWorth({ assets: [term], liabilities: [], baseCurrency: "INR" });
    expect(result.totalAssets).toEqual(zero("INR"));
  });

  it("counts only the surrender value of a ULIP, never the sum assured", () => {
    const ulip: Asset = {
      id: id(1), label: "ULIP", updatedAt: at,
      kind: "insurance", policyType: "ulip", insurer: "ICICI Pru",
      cover: money(5_000_000, "INR"), annualPremium: money(60_000, "INR"),
      surrenderValue: money(180_000, "INR"),
    };
    const result = computeNetWorth({ assets: [ulip], liabilities: [], baseCurrency: "INR" });
    expect(result.totalAssets).toEqual(money(180_000, "INR"));
  });
});
