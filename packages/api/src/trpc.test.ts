import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { ServiceError, type ServiceContext } from "@finlio/core/services";
import { appRouter } from "./root";
import type { Context } from "./trpc";

/**
 * The router's contract, exercised through a caller — no HTTP, no database.
 *
 * What is being checked is the boundary itself: that an anonymous request is
 * refused before any service runs, that a signed-in request reaches the service
 * scoped to that user, and that a domain `ServiceError` becomes the right tRPC
 * code. Business behaviour is tested in `packages/core`, not here.
 */
function callerFor(userId: string | null, services: Partial<ServiceContext> = {}) {
  const context: Context = {
    userId,
    services: (id) => ({ userId: id, ...services }) as ServiceContext,
  };
  return appRouter.createCaller(context);
}

describe("protectedProcedure", () => {
  it("refuses an anonymous caller before touching a service", async () => {
    const list = vi.fn();
    const caller = callerFor(null, { goals: { list } as never });

    await expect(caller.goal.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(list).not.toHaveBeenCalled();
  });

  it("scopes the service context to the authenticated user", async () => {
    const list = vi.fn(async () => []);
    const caller = callerFor("user-1", { goals: { list } as never });

    await caller.goal.list();
    expect(list).toHaveBeenCalledWith("user-1");
  });

  it("maps a limit_reached ServiceError to FORBIDDEN with its message", async () => {
    const caller = callerFor("user-1", {
      entitlements: { tierFor: async () => "free" },
      goals: {
        count: async () => 3,
        create: vi.fn(),
      } as never,
    });

    await expect(
      caller.goal.create({
        id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        name: "Fourth goal",
        target: { minor: 100_000_00, currency: "INR" },
        deadline: "2028-01-01",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: /Free accounts/ });
  });

  it("rejects input that fails the shared Zod schema", async () => {
    const caller = callerFor("user-1", {});
    await expect(
      caller.goal.create({
        id: "not-a-uuid",
        name: "",
        target: { minor: 1.5, currency: "INR" },
        deadline: "nope",
      } as never)
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("lets a non-ServiceError through untranslated", async () => {
    const caller = callerFor("user-1", {
      goals: {
        list: async () => {
          throw new Error("database is on fire");
        },
      } as never,
    });
    await expect(caller.goal.list()).rejects.toThrow("database is on fire");
  });
});

describe("ServiceError mapping", () => {
  it("covers every domain code", () => {
    for (const code of ["forbidden", "not_found", "limit_reached", "invalid"] as const) {
      expect(new ServiceError(code, "x").code).toBe(code);
    }
  });
});

describe("errorFormatter", () => {
  it("never lets an internal failure describe itself to the client", async () => {
    // Drizzle puts the full SQL in the message; that is a free schema dump.
    const caller = callerFor("user-1", {
      goals: {
        list: async () => {
          throw new Error('Failed query: select "id", "user_id" from "goals"');
        },
      } as never,
    });

    const formatted = await caller.goal.list().catch((error: unknown) => {
      const shape = appRouter._def._config.errorFormatter({
        error: error as never,
        shape: { message: (error as Error).message, code: -32603, data: {} } as never,
        type: "query",
        path: "goal.list",
        input: undefined,
        ctx: undefined,
      });
      return shape;
    });

    expect(JSON.stringify(formatted)).not.toContain("select");
    expect(JSON.stringify(formatted)).not.toContain("goals");
  });
});
