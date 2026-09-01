import type { CurrencyCode, Money } from "@finlio/schemas";
import { MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";

const LOCALE: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  SGD: "en-SG",
  AED: "en-AE",
};

/**
 * The single place money becomes text. Lives in domain (not the web app)
 * because the mobile app must format identically, and because the agent
 * envelope deliberately keeps amounts as `Money` so this runs instead of the
 * model inventing "₹1.2L".
 *
 * INR uses the Indian grouping (₹12,34,567) via `en-IN`.
 */
export function formatMoney(
  value: Money,
  opts: { compact?: boolean; showDecimals?: boolean } = {}
): string {
  const major = value.minor / MINOR_UNITS_PER_MAJOR;
  return new Intl.NumberFormat(LOCALE[value.currency], {
    style: "currency",
    currency: value.currency,
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.showDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(major);
}

/** A percent stored × 1e4 back to a display string. 425_000 → "42.5%". */
export function formatPercentE4(e4: number, digits = 1): string {
  return `${(e4 / 10_000).toFixed(digits)}%`;
}
