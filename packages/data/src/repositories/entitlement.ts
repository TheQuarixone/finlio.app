import { and, eq } from "drizzle-orm";
import type { SubscriptionTier } from "@finlio/schemas";
import type { EntitlementRepository } from "@finlio/core/ports";
import type { Db } from "../db/client";
import { subscriptions } from "../db/product";

export function createEntitlementRepository(db: Db): EntitlementRepository {
  return {
    async tierFor(userId): Promise<SubscriptionTier> {
      const [row] = await db
        .select({ tier: subscriptions.tier })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
        .limit(1);
      // No active subscription is not an error — it is the free tier.
      return row?.tier ?? "free";
    },
  };
}
