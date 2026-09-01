import { z } from "zod";
import { Money } from "@finlio/schemas";
import { createGoal, deleteGoal, listGoals, planGoals } from "@finlio/core/services";
import { protectedProcedure, router } from "../trpc";

const CreateGoal = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  target: Money,
  deadline: z.iso.date(),
  linkedAssetIds: z.array(z.uuid()).optional(),
});

export const goalRouter = router({
  list: protectedProcedure.query(({ ctx }) => listGoals(ctx.ctx)),

  create: protectedProcedure
    .input(CreateGoal)
    .mutation(({ ctx, input }) => createGoal(ctx.ctx, input)),

  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ ctx, input }) => deleteGoal(ctx.ctx, input.id)),

  /**
   * `saved` is supplied by the caller because the holdings behind it live on
   * the device — the server cannot compute it and is not meant to.
   */
  plan: protectedProcedure
    .input(z.object({ saved: Money }))
    .query(({ ctx, input }) => planGoals(ctx.ctx, input.saved)),
});
