import { describe, expect, it } from "vitest";
import { Asset } from "./asset";

const base = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  label: "Reliance",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

describe("Asset", () => {
  it("parses an equity holding", () => {
    const parsed = Asset.parse({
      ...base,
      kind: "equity",
      ticker: "RELIANCE",
      exchange: "NSE",
      qty: 20,
      avgPrice: { minor: 285_000, currency: "INR" },
    });
    expect(parsed.kind).toBe("equity");
  });

  it("keeps fractional MF units as scaled integers", () => {
    const parsed = Asset.parse({
      ...base,
      kind: "mutual_fund",
      isin: "INF109K01Z48",
      fund: "Parag Parikh Flexi Cap",
      unitsE6: 123_456_789,
      purchaseNav: { minor: 7_820, currency: "INR" },
    });
    expect(parsed).toMatchObject({ unitsE6: 123_456_789 });
  });

  it("rejects an unknown asset kind rather than silently widening", () => {
    expect(Asset.safeParse({ ...base, kind: "crypto", qty: 1 }).success).toBe(false);
  });

  it("rejects an equity holding missing its exchange", () => {
    const result = Asset.safeParse({
      ...base,
      kind: "equity",
      ticker: "RELIANCE",
      qty: 20,
      avgPrice: { minor: 285_000, currency: "INR" },
    });
    expect(result.success).toBe(false);
  });
});
