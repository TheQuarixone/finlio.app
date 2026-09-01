import { z } from "zod";
import { Money } from "./money";

/**
 * Fields every holding carries regardless of class.
 *
 * `manualValue` is what the user says it is worth today. The manual
 * ValuationProvider reads it; a live-price provider (Phase 3) overrides it
 * without a schema change.
 */
const AssetBase = z.object({
  id: z.uuid(),
  label: z.string().min(1).max(80),
  manualValue: Money.optional(),
  notes: z.string().max(500).optional(),
  updatedAt: z.iso.datetime(),
});

export const AssetKind = z.enum([
  "equity",
  "mutual_fund",
  "fixed_deposit",
  "real_estate",
  "cash",
  "epf",
  "ppf",
  "nps",
  "sgb",
  "insurance",
]);
export type AssetKind = z.infer<typeof AssetKind>;

/**
 * A discriminated union rather than one wide optional-everything object: adding
 * a class is additive, and `switch` exhaustiveness makes the compiler point at
 * every site that has to handle it.
 */
export const Asset = z.discriminatedUnion("kind", [
  AssetBase.extend({
    kind: z.literal("equity"),
    ticker: z.string().min(1).max(30),
    exchange: z.enum(["NSE", "BSE"]),
    qty: z.number().int().nonnegative(),
    avgPrice: Money,
    sector: z.string().max(60).optional(),
  }),
  AssetBase.extend({
    kind: z.literal("mutual_fund"),
    isin: z.string().min(1).max(20),
    fund: z.string().min(1).max(120),
    /** Units × 1e6 — see UNITS_SCALE. */
    unitsE6: z.number().int().nonnegative(),
    purchaseNav: Money,
    folio: z.string().max(40).optional(),
  }),
  AssetBase.extend({
    kind: z.literal("fixed_deposit"),
    bank: z.string().min(1).max(80),
    principal: Money,
    /** Annual rate × 1e4 — see RATE_SCALE. */
    ratePctE4: z.number().int().nonnegative(),
    startDate: z.iso.date(),
    maturityDate: z.iso.date(),
  }),
  AssetBase.extend({
    kind: z.literal("real_estate"),
    propertyType: z.enum(["apartment", "house", "plot", "commercial"]),
    purchasePrice: Money,
    estimatedValue: Money,
  }),
  AssetBase.extend({
    kind: z.literal("cash"),
    institution: z.string().min(1).max(80),
    balance: Money,
  }),
  AssetBase.extend({
    kind: z.literal("epf"),
    employer: z.string().max(80).optional(),
    balance: Money,
    asOf: z.iso.date(),
  }),
  AssetBase.extend({
    kind: z.literal("ppf"),
    bank: z.string().max(80).optional(),
    balance: Money,
    maturityDate: z.iso.date().optional(),
  }),
  AssetBase.extend({
    kind: z.literal("nps"),
    tier: z.enum(["I", "II"]),
    balance: Money,
    asOf: z.iso.date(),
  }),
  AssetBase.extend({
    kind: z.literal("sgb"),
    series: z.string().max(40).optional(),
    /** Grams × 1e6 — see UNITS_SCALE. */
    gramsE6: z.number().int().nonnegative(),
    purchasePrice: Money,
    maturityDate: z.iso.date().optional(),
  }),
  AssetBase.extend({
    kind: z.literal("insurance"),
    policyType: z.enum(["term", "health", "ulip", "endowment"]),
    insurer: z.string().max(80),
    cover: Money,
    annualPremium: Money,
    /** Term and health policies have no surrender value — they are not net worth. */
    surrenderValue: Money.optional(),
  }),
]);
export type Asset = z.infer<typeof Asset>;
