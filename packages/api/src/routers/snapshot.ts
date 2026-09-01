import { z } from "zod";
import { MonthlySnapshot } from "@finlio/schemas";
import { listSnapshots, recordSnapshot } from "@finlio/core/services";
import { protectedProcedure, router } from "../trpc";

export const snapshotRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(120).optional() }).optional())
    .query(({ ctx, input }) => listSnapshots(ctx.ctx, input?.limit)),

  /** Aggregates only — the schema has no room for a holding (ADR-0004). */
  record: protectedProcedure
    .input(MonthlySnapshot)
    .mutation(({ ctx, input }) => recordSnapshot(ctx.ctx, input)),
});
