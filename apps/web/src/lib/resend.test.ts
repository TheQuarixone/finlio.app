import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression cover for a real outage: the client used to be constructed at
 * module scope, so importing this file threw when RESEND_API_KEY was unset —
 * which took down waitlist signup entirely. Supabase is the source of truth
 * (ADR-0003), so email config must never be able to break a signup.
 */

afterEach(() => {
  vi.resetModules();
  delete process.env.RESEND_API_KEY;
});

describe("resend client", () => {
  it("imports without throwing when no API key is set", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(import("@/lib/resend")).resolves.toBeDefined();
  });

  it("reports unconfigured when the key is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { isResendConfigured } = await import("@/lib/resend");
    expect(isResendConfigured()).toBe(false);
  });

  it("throws only when a caller actually asks for the client", async () => {
    delete process.env.RESEND_API_KEY;
    const { getResend } = await import("@/lib/resend");
    expect(() => getResend()).toThrow(/RESEND_API_KEY/);
  });

  it("builds and reuses one client once configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const { getResend, isResendConfigured } = await import("@/lib/resend");
    expect(isResendConfigured()).toBe(true);
    expect(getResend()).toBe(getResend());
  });
});
