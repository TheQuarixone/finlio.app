import { describe, expect, it } from "vitest";
import {
  INBOUND_ADDRESSES,
  isInboundAddress,
  normaliseAddress,
  wouldLoop,
} from "@/lib/inbound";

/**
 * The loop guard is the part worth testing: getting it wrong means mail
 * ping-ponging between Resend and the relay until someone notices.
 */

describe("normaliseAddress", () => {
  it("reads a bare address", () => {
    expect(normaliseAddress("Hello@Finlio.app ")).toBe("hello@finlio.app");
  });

  it("reads the address out of a display name", () => {
    expect(normaliseAddress("Finlio Privacy <Privacy@finlio.app>")).toBe(
      "privacy@finlio.app"
    );
  });
});

describe("isInboundAddress", () => {
  it("recognises every address we publish", () => {
    for (const address of INBOUND_ADDRESSES) {
      expect(isInboundAddress(address)).toBe(true);
    }
  });

  it("recognises them regardless of case or display name", () => {
    expect(isInboundAddress("<GRIEVANCE@FINLIO.APP>")).toBe(true);
  });

  it("does not claim other addresses on the domain", () => {
    expect(isInboundAddress("someone@finlio.app")).toBe(false);
    expect(isInboundAddress("hello@example.com")).toBe(false);
  });
});

describe("wouldLoop", () => {
  it("is false for a real destination mailbox", () => {
    expect(wouldLoop("team@example.com")).toBe(false);
  });

  it("is false when forwarding is switched off", () => {
    expect(wouldLoop(undefined)).toBe(false);
  });

  it("catches a destination that is one of our own inbound addresses", () => {
    expect(wouldLoop("privacy@finlio.app")).toBe(true);
  });

  it("catches one buried in a list of recipients", () => {
    expect(wouldLoop("team@example.com, Hello@finlio.app")).toBe(true);
  });
});
