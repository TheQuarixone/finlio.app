import { describe, expect, it } from "vitest";
import { Money } from "./money";

describe("Money", () => {
  it("accepts an integer count of minor units", () => {
    expect(Money.parse({ minor: 150_000, currency: "INR" })).toEqual({
      minor: 150_000,
      currency: "INR",
    });
  });

  it("rejects a float — money is never a float (phase-2.1 D2)", () => {
    expect(Money.safeParse({ minor: 1500.5, currency: "INR" }).success).toBe(false);
  });

  it("accepts negatives, so a net worth underwater still parses", () => {
    expect(Money.safeParse({ minor: -50_000, currency: "INR" }).success).toBe(true);
  });

  it("rejects an unsupported currency", () => {
    expect(Money.safeParse({ minor: 100, currency: "GBP" }).success).toBe(false);
  });
});
