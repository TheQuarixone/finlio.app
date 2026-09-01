import { z } from "zod";
import { Asset } from "./asset";
import { CurrencyCode, Money } from "./money";
import { Goal } from "./goal";
import { Liability } from "./liability";
import { RiskProfile } from "./profile";

/**
 * The on-device document — the user's actual financial data (PRD Appendix A).
 *
 * Markdown is the *serialization format*, not the model. In memory this typed
 * object is the truth; `@finlio/core/domain` finlio-v1.ts parses Markdown into
 * it and serializes it back out. Keeping the model typed means the net-worth
 * engine never parses text, and the parser has one obvious contract to satisfy.
 */
export const FINLIO_SCHEMA_VERSION = "finlio/v1" as const;

export const DocumentMeta = z.object({
  schema: z.literal(FINLIO_SCHEMA_VERSION),
  baseCurrency: CurrencyCode.default("INR"),
  riskProfile: RiskProfile.optional(),
  annualIncome: Money.optional(),
  monthlyExpenses: Money.optional(),
  lastSync: z.iso.datetime().optional(),
});
export type DocumentMeta = z.infer<typeof DocumentMeta>;

/** A derived month-end aggregate. Safe to sync — carries no holdings. */
export const MonthlySnapshot = z.object({
  /** YYYY-MM */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  netWorth: Money,
  totalAssets: Money,
  totalLiabilities: Money,
  /** Savings rate × 1e4 — 42.5% is 425_000. */
  savingsRateE4: z.number().int().optional(),
});
export type MonthlySnapshot = z.infer<typeof MonthlySnapshot>;

export const FinlioDocument = z.object({
  meta: DocumentMeta,
  assets: z.array(Asset).default([]),
  liabilities: z.array(Liability).default([]),
  /**
   * **Export-only.** Goals are stored on the server, not here — they are
   * metadata (a name, a number, a date) that the Phase-3 Goal Coach has to
   * reach on a schedule, and an agent running in a cron job cannot open
   * somebody's browser.
   *
   * The field stays because PRD Appendix A defines it and a full data export
   * should be complete (STORE-7). The app never writes it; whatever fills it
   * pulls from the server at export time.
   */
  goals: z.array(Goal).default([]),
  snapshots: z.array(MonthlySnapshot).default([]),
});
export type FinlioDocument = z.infer<typeof FinlioDocument>;

export const emptyDocument = (baseCurrency: CurrencyCode = "INR"): FinlioDocument => ({
  meta: { schema: FINLIO_SCHEMA_VERSION, baseCurrency },
  assets: [],
  liabilities: [],
  goals: [],
  snapshots: [],
});
