import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Storage is mocked at the repository seam so these run anywhere (CI has no
 * Postgres). They cover the decisions this module makes — new vs duplicate
 * signup, the seeded count, and that a Resend mirror failure can never fail a
 * signup (ADR-0003: Supabase is the source of truth).
 */

const countSubscribers = vi.fn<() => Promise<number>>();
const insertSubscriber = vi.fn<(email: string, source: string) => Promise<boolean>>();

vi.mock("@finlio/data/repositories", () => ({
  countSubscribers: (...args: []) => countSubscribers(...args),
  insertSubscriber: (email: string, source: string) => insertSubscriber(email, source),
}));

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
  countSubscribers.mockResolvedValue(0);
  insertSubscriber.mockResolvedValue(true);
});

describe("getWaitlistCount", () => {
  it("adds the display seed to the row count", async () => {
    countSubscribers.mockResolvedValue(7);
    await expect(getWaitlistCount()).resolves.toBe(SEED_COUNT + 7);
  });

  it("treats an empty list as zero", async () => {
    countSubscribers.mockResolvedValue(0);
    await expect(getWaitlistCount()).resolves.toBe(SEED_COUNT);
  });
});

describe("addToWaitlist", () => {
  it("reports a new signup as added", async () => {
    await expect(addToWaitlist("New@Example.com")).resolves.toMatchObject({ added: true });
  });

  it("normalises the email before storing it", async () => {
    await addToWaitlist("  MiXeD@Example.COM  ");
    expect(insertSubscriber).toHaveBeenCalledWith("mixed@example.com", "landing");
  });

  it("passes the source through for attribution", async () => {
    await addToWaitlist("someone@example.com", "footer");
    expect(insertSubscriber).toHaveBeenCalledWith("someone@example.com", "footer");
  });

  it("reports a duplicate as not added", async () => {
    insertSubscriber.mockResolvedValue(false); // unique conflict → nothing inserted
    await expect(addToWaitlist("dupe@example.com")).resolves.toMatchObject({ added: false });
  });

  it("returns the seeded count", async () => {
    countSubscribers.mockResolvedValue(3);
    await expect(addToWaitlist("someone@example.com")).resolves.toMatchObject({
      count: SEED_COUNT + 3,
    });
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
    insertSubscriber.mockResolvedValue(false);
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
