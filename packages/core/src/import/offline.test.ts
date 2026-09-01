import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectBroker, parseHoldings, planMerge } from "./brokers";

/**
 * CSV-5 — the import pipeline must never make a network call.
 *
 * This is the privacy claim in the import flow: a broker export lists every
 * position a person holds, and the promise is that it is read in their browser
 * and goes nowhere (ADR-0004). A future refactor that "enriches" a row by
 * looking up a ticker would break that quietly — the feature would still work,
 * so nothing else would fail. This test is what fails.
 */
describe("import is offline by construction", () => {
  const network: Record<string, ReturnType<typeof vi.fn>> = {};

  beforeEach(() => {
    network.fetch = vi.fn(() => {
      throw new Error("import made a network call");
    });
    vi.stubGlobal("fetch", network.fetch);
    vi.stubGlobal("XMLHttpRequest", class { constructor() { throw new Error("import used XHR"); } });
    vi.stubGlobal("WebSocket", class { constructor() { throw new Error("import opened a socket"); } });
    vi.stubGlobal("navigator", { sendBeacon: () => { throw new Error("import used sendBeacon"); } });
  });

  afterEach(() => vi.unstubAllGlobals());

  const csv = [
    "Symbol,ISIN,Quantity,Average Price",
    "RELIANCE,INE002A01018,20,2850.00",
    "INFY,INE009A01021,8,1450.00",
  ].join("\n");

  it("detects, parses and plans a merge without touching the network", () => {
    const broker = detectBroker(csv);
    expect(broker).toBe("zerodha");

    const parsed = parseHoldings(csv, broker!, {
      now: new Date("2026-09-01T00:00:00.000Z"),
      makeId: () => "fixed-id",
    });
    expect(parsed.rows).toHaveLength(2);

    const plan = planMerge([], parsed.rows.map((row) => row.asset));
    expect(plan.added).toHaveLength(2);

    expect(network.fetch).not.toHaveBeenCalled();
  });

  it("stays offline on a malformed file too", () => {
    const parsed = parseHoldings("nonsense\n1,2,3", "zerodha", {
      now: new Date("2026-09-01T00:00:00.000Z"),
      makeId: () => "fixed-id",
    });
    expect(parsed.rows).toEqual([]);
    expect(network.fetch).not.toHaveBeenCalled();
  });
});
