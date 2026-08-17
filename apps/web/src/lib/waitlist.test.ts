import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The DB is mocked so these run anywhere (CI has no Postgres). They cover the
 * decisions this module makes — new vs duplicate signup, the seeded count, and
 * that a Resend mirror failure can never fail a signup (ADR-0003: Supabase is
 * the source of truth).
 */

const returning = vi.fn();
const onConflictDoNothing = vi.fn(() => ({ returning }));
const values = vi.fn(() => ({ onConflictDoNothing }));
const insert = vi.fn(() => ({ values }));
const from = vi.fn();
const select = vi.fn(() => ({ from }));

vi.mock("@/db", () => ({ db: { insert, select } }));

const contactsCreate = vi.fn();
vi.mock("@/lib/resend", () => ({
  isResendConfigured: () => Boolean(process.env.RESEND_API_KEY),
  getResend: () => ({ contacts: { create: contactsCreate } }),
}));

const SEED_COUNT = 1_284;

// Imported after the mocks are registered.
const { addToWaitlist, getWaitlistCount } = await import("@/lib/waitlist");

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.RESEND_API_KEY;
  from.mockResolvedValue([{ value: 0 }]);
  returning.mockResolvedValue([{ id: "sub_1" }]);
});

describe("getWaitlistCount", () => {
  it("adds the display seed to the row count", async () => {
    from.mockResolvedValue([{ value: 7 }]);
    await expect(getWaitlistCount()).resolves.toBe(SEED_COUNT + 7);
  });

  it("treats a missing row as zero", async () => {
    from.mockResolvedValue([]);
    await expect(getWaitlistCount()).resolves.toBe(SEED_COUNT);
  });
});

describe("addToWaitlist", () => {
  it("reports a new signup as added", async () => {
    const result = await addToWaitlist("New@Example.com");
    expect(result.added).toBe(true);
  });

  it("normalises the email before storing it", async () => {
    await addToWaitlist("  MiXeD@Example.COM  ");
    expect(values).toHaveBeenCalledWith({
      email: "mixed@example.com",
      source: "landing",
    });
  });

  it("reports a duplicate as not added", async () => {
    returning.mockResolvedValue([]); // unique conflict → nothing inserted
    const result = await addToWaitlist("dupe@example.com");
    expect(result.added).toBe(false);
  });

  it("returns the seeded count", async () => {
    from.mockResolvedValue([{ value: 3 }]);
    const result = await addToWaitlist("someone@example.com");
    expect(result.count).toBe(SEED_COUNT + 3);
  });

  it("skips the Resend mirror when no API key is configured", async () => {
    await addToWaitlist("nokey@example.com");
    expect(contactsCreate).not.toHaveBeenCalled();
  });

  it("mirrors a new signup to Resend when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    await addToWaitlist("mirror@example.com");
    expect(contactsCreate).toHaveBeenCalledWith({ email: "mirror@example.com" });
  });

  it("does not mirror a duplicate", async () => {
    process.env.RESEND_API_KEY = "re_test";
    returning.mockResolvedValue([]);
    await addToWaitlist("dupe@example.com");
    expect(contactsCreate).not.toHaveBeenCalled();
  });

  it("still succeeds when the Resend mirror throws", async () => {
    process.env.RESEND_API_KEY = "re_test";
    contactsCreate.mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(addToWaitlist("resilient@example.com")).resolves.toMatchObject({
      added: true,
    });
  });
});
