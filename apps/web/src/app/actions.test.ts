import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Covers the server action's contract: what it accepts, what it tells the user,
 * and that a failed confirmation email never fails the signup itself.
 */

const addToWaitlist = vi.fn();
const sendWaitlistConfirmation = vi.fn();

vi.mock("@/lib/waitlist", () => ({ addToWaitlist }));
vi.mock("@/lib/email", () => ({ sendWaitlistConfirmation }));

const { joinWaitlist } = await import("@/app/actions");

const initial = {
  status: "idle" as const,
  message: "",
  count: null,
  email: null,
  added: false,
};
const submit = (email: string) => {
  const data = new FormData();
  data.set("email", email);
  return joinWaitlist(initial, data);
};

beforeEach(() => {
  vi.clearAllMocks();
  addToWaitlist.mockResolvedValue({ added: true, count: 1_285 });
  sendWaitlistConfirmation.mockResolvedValue(undefined);
});

describe("joinWaitlist validation", () => {
  it.each(["", "not-an-email", "no@tld", "@example.com", "spaced out@x.com"])(
    "rejects %j without touching storage",
    async (email) => {
      const result = await submit(email);
      expect(result.status).toBe("error");
      expect(addToWaitlist).not.toHaveBeenCalled();
    }
  );

  it.each(["a@b.co", "first.last+tag@sub.example.in"])(
    "accepts %j",
    async (email) => {
      const result = await submit(email);
      expect(result.status).toBe("success");
    }
  );

  it("errors when the field is missing entirely", async () => {
    const result = await joinWaitlist(initial, new FormData());
    expect(result.status).toBe("error");
  });
});

describe("joinWaitlist behaviour", () => {
  it("sends a confirmation for a new signup and returns the count", async () => {
    const result = await submit("new@example.com");
    expect(sendWaitlistConfirmation).toHaveBeenCalledWith("new@example.com");
    expect(result).toMatchObject({
      status: "success",
      count: 1_285,
      email: "new@example.com",
      added: true,
    });
  });

  it("normalises the email it echoes back to the UI", async () => {
    const result = await submit("  MiXeD@Example.COM  ");
    expect(result.email).toBe("mixed@example.com");
  });

  it("flags an existing subscriber so the UI can change its copy", async () => {
    addToWaitlist.mockResolvedValue({ added: false, count: 1_285 });
    const result = await submit("existing@example.com");
    expect(result.added).toBe(false);
  });

  it("does not re-send a confirmation to an existing subscriber", async () => {
    addToWaitlist.mockResolvedValue({ added: false, count: 1_285 });
    const result = await submit("existing@example.com");
    expect(sendWaitlistConfirmation).not.toHaveBeenCalled();
    expect(result.status).toBe("success");
    expect(result.message).toMatch(/already/i);
  });

  it("still succeeds when the confirmation email fails", async () => {
    sendWaitlistConfirmation.mockRejectedValue(new Error("smtp down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await submit("emailfail@example.com");
    expect(result.status).toBe("success");
  });

  it("reports an error when storage fails", async () => {
    addToWaitlist.mockRejectedValue(new Error("db down"));
    const result = await submit("dbfail@example.com");
    expect(result).toMatchObject({ status: "error", count: null });
  });
});
