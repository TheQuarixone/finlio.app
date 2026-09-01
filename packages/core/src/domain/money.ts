import { type CurrencyCode, type Money, MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";

/** Money arithmetic. Integer minor units in, integer minor units out. */

export class CurrencyMismatchError extends Error {
  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Cannot combine ${a} and ${b} without an FX rate.`);
    this.name = "CurrencyMismatchError";
  }
}

export const zero = (currency: CurrencyCode): Money => ({ minor: 0, currency });

export const money = (major: number, currency: CurrencyCode = "INR"): Money => ({
  minor: Math.round(major * MINOR_UNITS_PER_MAJOR),
  currency,
});

function sameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
}

export function add(a: Money, b: Money): Money {
  sameCurrency(a, b);
  return { minor: a.minor + b.minor, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  sameCurrency(a, b);
  return { minor: a.minor - b.minor, currency: a.currency };
}

export function negate(a: Money): Money {
  return { minor: -a.minor, currency: a.currency };
}

/**
 * Sum a list. An empty list needs a currency from somewhere, so it is passed
 * explicitly rather than guessed — a zero in the wrong currency is the kind of
 * bug that only shows up once a user has two.
 */
export function sum(values: readonly Money[], currency: CurrencyCode): Money {
  return values.reduce<Money>((acc, v) => add(acc, v), zero(currency));
}

/**
 * Multiply money by a quantity that is itself an integer scaled by `scale`
 * (units × 1e6, a percentage × 1e4, …).
 *
 * The intermediate product goes through BigInt: units can reach 1e11 and a NAV
 * in paise 1e7, and 1e18 is past Number.MAX_SAFE_INTEGER. Rounding is
 * half-away-from-zero so a holding worth ₹0.005 doesn't quietly vanish.
 */
export function multiplyScaled(value: Money, scaledQty: number, scale: number): Money {
  const product = BigInt(value.minor) * BigInt(scaledQty);
  const divisor = BigInt(scale);
  const quotient = product / divisor;
  const remainder = product % divisor;
  const roundsUp = remainder * 2n >= divisor || remainder * -2n >= divisor;
  const adjustment = roundsUp ? (product < 0n ? -1n : 1n) : 0n;
  return { minor: Number(quotient + adjustment), currency: value.currency };
}

/** Multiply by a plain integer count (20 shares × avg price). */
export function multiply(value: Money, qty: number): Money {
  return { minor: value.minor * qty, currency: value.currency };
}

export const isZero = (a: Money): boolean => a.minor === 0;
export const isNegative = (a: Money): boolean => a.minor < 0;

export function compare(a: Money, b: Money): number {
  sameCurrency(a, b);
  return a.minor - b.minor;
}

/** `part` as a percentage of `whole`, × 1e4. 42.5% → 425_000. */
export function percentE4(part: Money, whole: Money): number {
  sameCurrency(part, whole);
  if (whole.minor === 0) return 0;
  return Math.round((part.minor / whole.minor) * 100 * 10_000);
}
