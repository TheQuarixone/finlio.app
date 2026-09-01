import { describe, expect, it } from "vitest";
import { UNITS_SCALE } from "@finlio/schemas";
import {
  CurrencyMismatchError, add, compare, money, multiply, multiplyScaled,
  percentE4, subtract, sum, zero,
} from "./money";

describe("money arithmetic", () => {
  it("converts major units to minor", () => {
    expect(money(1234.56, "INR")).toEqual({ minor: 123_456, currency: "INR" });
  });

  it("adds and subtracts within a currency", () => {
    const a = money(100, "INR");
    const b = money(40, "INR");
    expect(add(a, b).minor).toBe(14_000);
    expect(subtract(a, b).minor).toBe(6_000);
  });

  it("refuses to combine currencies rather than silently adding them", () => {
    expect(() => add(money(100, "INR"), money(100, "USD"))).toThrow(CurrencyMismatchError);
  });

  it("sums an empty list to zero in the currency it was told", () => {
    expect(sum([], "INR")).toEqual(zero("INR"));
  });

  it("multiplies by a share count", () => {
    expect(multiply(money(2850, "INR"), 20).minor).toBe(5_700_000);
  });

  describe("multiplyScaled", () => {
    it("values fractional mutual-fund units", () => {
      // 123.456789 units at a NAV of ₹78.20
      const value = multiplyScaled(money(78.2, "INR"), 123_456_789, UNITS_SCALE);
      expect(value.minor).toBe(965_432);
    });

    it("stays exact past Number.MAX_SAFE_INTEGER in the intermediate", () => {
      // 1e11 scaled units × 1e7 paise would overflow a float multiply.
      const value = multiplyScaled({ minor: 10_000_000, currency: "INR" }, 100_000_000_000, UNITS_SCALE);
      expect(value.minor).toBe(1_000_000_000_000);
    });

    it("rounds half away from zero so tiny holdings do not vanish", () => {
      expect(multiplyScaled({ minor: 1, currency: "INR" }, 500_000, UNITS_SCALE).minor).toBe(1);
      expect(multiplyScaled({ minor: 1, currency: "INR" }, 499_999, UNITS_SCALE).minor).toBe(0);
    });
  });

  it("computes a percentage scaled by 1e4", () => {
    expect(percentE4(money(425, "INR"), money(1000, "INR"))).toBe(425_000);
  });

  it("treats a percentage of nothing as zero rather than dividing by zero", () => {
    expect(percentE4(money(10, "INR"), zero("INR"))).toBe(0);
  });

  it("orders amounts", () => {
    expect(compare(money(10, "INR"), money(4, "INR"))).toBeGreaterThan(0);
  });
});
