import type { SubscriptionTier } from "@finlio/schemas";
import type { ServiceContext } from "./context";

/** Clients read their tier from the account, never from a local purchase record. */
export async function getEntitlement(ctx: ServiceContext): Promise<SubscriptionTier> {
  return ctx.entitlements.tierFor(ctx.userId);
}
