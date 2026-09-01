import { z } from "zod";

/**
 * Currencies Finlio can hold value in. INR is the base currency at launch;
 * the rest exist for NRI mode (PRD §6.4 / Phase 4) so the shape doesn't move
 * when multi-currency lands.
 */
export const CurrencyCode = z.enum(["INR", "USD", "SGD", "AED"]);
export type CurrencyCode = z.infer<typeof CurrencyCode>;

/**
 * Money is an integer count of *minor units* — paise for INR, cents for USD.
 *
 * Never a float. Aggregating a portfolio walks 20+ asset classes and floats
 * drift; XIRR (Phase 3) is sensitive at the boundaries. Arithmetic lives in
 * `@finlio/core/domain` (money.ts); formatting is `Intl.NumberFormat` at the
 * view layer, never here.
 */
export const Money = z.object({
  minor: z.number().int(),
  currency: CurrencyCode,
});
export type Money = z.infer<typeof Money>;

/** Minor units per major unit. All four currencies happen to be 100. */
export const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Fractional quantities (mutual-fund units, SGB grams) as an integer scaled by
 * 1e6. Brokers report 3-4 decimals; 6 covers every real CSV without pulling in
 * a decimal library. See docs/phase-2.1.md D2.
 */
export const UNITS_SCALE = 1_000_000;

/** Percentages as an integer scaled by 1e4 — 7.15% is 71_500. */
export const RATE_SCALE = 10_000;
