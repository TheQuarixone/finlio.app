import { eq } from "drizzle-orm";
import type { EntitlementChange } from "@finlio/core/services";
import { db } from "../db/client";
import { subscriptions } from "../db/product";

/**
 * Written only by the payment webhook, never by a client — an entitlement a
 * user can write is not an entitlement (ADR-0002, architecture §4.6).
 *
 * Upserts on the provider's subscription id so a redelivered webhook converges
 * on the same row rather than granting a second subscription.
 */
export async function applyEntitlementChange(change: EntitlementChange): Promise<void> {
  await db
    .insert(subscriptions)
    .values({
      userId: change.userId,
      tier: change.tier,
      status: change.status,
      providerCustomerId: change.customerId,
      providerSubscriptionId: change.subscriptionId,
      currentPeriodEnd: change.currentPeriodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.providerSubscriptionId,
      set: {
        tier: change.tier,
        status: change.status,
        currentPeriodEnd: change.currentPeriodEnd,
        updatedAt: new Date(),
      },
    });
}

export async function findSubscriptionByProviderId(providerSubscriptionId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
    .limit(1);
  return row ?? null;
}
