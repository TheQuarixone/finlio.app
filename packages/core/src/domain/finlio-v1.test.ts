import { describe, expect, it } from "vitest";
import { type Asset, type FinlioDocument, FINLIO_SCHEMA_VERSION, emptyDocument } from "@finlio/schemas";
import { FinlioParseError, parse, serialize } from "./finlio-v1";
import { money } from "./money";

const at = "2026-09-01T10:00:00.000Z";
const uid = (n: number) => `3f2504e0-4f89-41d3-9a0c-0305e82c33${String(n).padStart(2, "0")}`;

const doc: FinlioDocument = {
  meta: {
    schema: FINLIO_SCHEMA_VERSION,
    baseCurrency: "INR",
    riskProfile: "moderate",
    annualIncome: money(1_800_000, "INR"),
    monthlyExpenses: money(55_000, "INR"),
  },
  assets: [
    {
      id: uid(1), label: "Reliance", updatedAt: at, kind: "equity",
      ticker: "RELIANCE", exchange: "NSE", qty: 20,
      avgPrice: money(2850, "INR"), sector: "Energy",
    },
    {
      id: uid(2), label: "PPFAS Flexi Cap", updatedAt: at, kind: "mutual_fund",
      isin: "INF109K01Z48", fund: "Parag Parikh Flexi Cap",
      unitsE6: 123_456_789, purchaseNav: money(78.2, "INR"), folio: "12345/09",
    },
    {
      id: uid(3), label: "HDFC Savings", updatedAt: at, kind: "cash",
      institution: "HDFC Bank", balance: money(250_000, "INR"),
    },
  ] as Asset[],
  liabilities: [
    {
      id: uid(4), kind: "home_loan", label: "Flat", lender: "SBI",
      outstanding: money(1_800_000, "INR"), emi: money(42_000, "INR"),
      ratePctE4: 87_500, endDate: "2038-04-01", updatedAt: at,
    },
  ],
  goals: [
    {
      id: uid(5), name: "Emergency fund", target: money(600_000, "INR"),
      deadline: "2027-12-31", linkedAssetIds: [uid(3)],
      createdAt: at, updatedAt: at,
    },
  ],
  snapshots: [
    {
      month: "2026-08", netWorth: money(-1_200_000, "INR"),
      totalAssets: money(600_000, "INR"), totalLiabilities: money(1_800_000, "INR"),
      savingsRateE4: 425_000,
    },
  ],
};

describe("finlio/v1 codec", () => {
  it("round-trips a full document without loss", () => {
    expect(parse(serialize(doc))).toEqual(doc);
  });

  it("round-trips an empty document", () => {
    expect(parse(serialize(emptyDocument("INR")))).toEqual(emptyDocument("INR"));
  });

  it("writes human-readable Markdown with the PRD's headings", () => {
    const md = serialize(doc);
    expect(md).toContain("schema: finlio/v1");
    expect(md).toContain("## Assets");
    expect(md).toContain("### Equity");
    expect(md).toContain("### Mutual Funds");
    expect(md).toContain("## Liabilities");
    expect(md).toContain("| Ticker |");
  });

  it("keeps rupee amounts as plain decimals, not formatted currency", () => {
    // Formatting is a view concern; the file stays machine-parseable.
    expect(serialize(doc)).toContain("2850.00");
    expect(serialize(doc)).not.toContain("₹");
  });

  it("survives a pipe inside a label", () => {
    const tricky: FinlioDocument = {
      ...doc,
      assets: [{ ...(doc.assets[0] as Asset), label: "Reliance | NSE" }],
    };
    expect(parse(serialize(tricky)).assets[0]?.label).toBe("Reliance | NSE");
  });

  it("preserves fractional MF units exactly", () => {
    const parsed = parse(serialize(doc));
    const mf = parsed.assets.find((a) => a.kind === "mutual_fund");
    expect(mf).toMatchObject({ unitsE6: 123_456_789 });
  });

  it("rejects a file with no frontmatter", () => {
    expect(() => parse("# Just a heading")).toThrow(FinlioParseError);
  });

  it("rejects a future schema version rather than silently misreading it", () => {
    expect(() => parse("---\nschema: finlio/v2\n---\n")).toThrow(/Unsupported schema/);
  });
});
