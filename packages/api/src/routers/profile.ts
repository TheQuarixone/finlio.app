import { ProfileUpdate } from "@finlio/schemas";
import { getEntitlement, getProfile, updateProfile } from "@finlio/core/services";
import { protectedProcedure, router } from "../trpc";

export const profileRouter = router({
  get: protectedProcedure.query(({ ctx }) => getProfile(ctx.ctx)),

  update: protectedProcedure
    .input(ProfileUpdate)
    .mutation(({ ctx, input }) => updateProfile(ctx.ctx, input)),

  /** Tier comes from the account, never from anything the client sent. */
  entitlement: protectedProcedure.query(({ ctx }) => getEntitlement(ctx.ctx)),
});
