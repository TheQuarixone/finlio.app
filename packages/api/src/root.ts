import { router } from "./trpc";
import { goalRouter } from "./routers/goal";
import { profileRouter } from "./routers/profile";
import { snapshotRouter } from "./routers/snapshot";

export const appRouter = router({
  profile: profileRouter,
  goal: goalRouter,
  snapshot: snapshotRouter,
});

/** The contract both clients consume. Exported as a type, so it costs nothing. */
export type AppRouter = typeof appRouter;
