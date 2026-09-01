import { describe, expect, it } from "vitest";
import { scrubEvent, scrubText, scrubValue } from "./scrub";

/**
 * These assertions are the product promise, not style preferences. If one of
 * them fails, someone's balance is on its way to a third party.
 */

describe("scrubText", () => {
  it("removes rupee amounts", () => {
    expect(scrubText("Net worth is ₹17,43,000 today")).not.toContain("17,43,000");
  });

  it("removes amounts written without a symbol", () => {
    expect(scrubText("balance 1743000 after transfer")).not.toContain("1743000");
  });

  it("removes email addresses", () => {
    expect(scrubText("failed for gokul@example.com")).not.toContain("@example.com");
  });

  it("keeps short numbers, so line numbers and counts stay useful", () => {
    expect(scrubText("failed at line 42 of 7 rows")).toContain("42");
  });
});

describe("scrubValue", () => {
  it("redacts any key that looks financial", () => {
    const scrubbed = scrubValue({ minor: 1743000, currency: "INR" }) as Record<string, unknown>;
    expect(scrubbed.minor).toBe("[redacted]");
    // Currency is not sensitive and is genuinely useful when debugging.
    expect(scrubbed.currency).toBe("INR");
  });

  it("redacts nested holdings", () => {
    const scrubbed = JSON.stringify(
      scrubValue({ doc: { assets: [{ ticker: "RELIANCE", qty: 20 }] } })
    );
    expect(scrubbed).not.toContain("20");
  });

  it("redacts credentials", () => {
    const scrubbed = scrubValue({ authorization: "Bearer abc", apiKey: "sk-1" }) as Record<string, unknown>;
    expect(scrubbed.authorization).toBe("[redacted]");
    expect(scrubbed.apiKey).toBe("[redacted]");
  });

  it("terminates on deeply nested input instead of hanging", () => {
    let deep: Record<string, unknown> = { end: true };
    for (let i = 0; i < 50; i += 1) deep = { nested: deep };
    expect(() => scrubValue(deep)).not.toThrow();
  });
});

describe("scrubEvent", () => {
  it("scrubs an exception message carrying a balance", () => {
    const event = scrubEvent({
      exception: { values: [{ type: "Error", value: "Failed to save ₹17,43,000" }] },
    });
    expect(event.exception?.values?.[0]?.value).not.toContain("17,43,000");
  });

  it("drops the query string, a classic accidental leak path", () => {
    const event = scrubEvent({ request: { url: "https://finlio.app/app?amount=1743000" } });
    expect(event.request?.url).toBe("https://finlio.app/app");
  });

  it("keeps the user id but discards everything else about them", () => {
    const event = scrubEvent({ user: { id: "user-1", email: "gokul@example.com", ip_address: "1.2.3.4" } });
    expect(event.user).toEqual({ id: "user-1" });
  });

  it("scrubs breadcrumbs, which is where amounts usually hide", () => {
    const event = scrubEvent({
      breadcrumbs: [{ message: "saved document with net worth ₹17,43,000" }],
    });
    expect(JSON.stringify(event)).not.toContain("17,43,000");
  });

  it("leaves an ordinary error entirely readable", () => {
    const event = scrubEvent({
      exception: { values: [{ type: "TypeError", value: "Cannot read property 'map' of undefined" }] },
    });
    expect(event.exception?.values?.[0]?.value).toBe("Cannot read property 'map' of undefined");
  });

  it("never lets a raw finlio/v1 document through", () => {
    const markdown = "---\nschema: finlio/v1\n---\n| RELIANCE | 20 | 2850.00 |";
    const event = scrubEvent({ extra: { markdown } });
    expect(JSON.stringify(event)).not.toContain("2850.00");
  });
});
