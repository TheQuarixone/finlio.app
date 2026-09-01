import type { SubscriptionTier } from "@finlio/schemas";

/**
 * Turning a payment provider's event into an entitlement.
 *
 * Pure and provider-shaped-but-not-provider-coupled, so the mapping is testable
 * without a webhook, a signature, or a database — and so swapping providers is
 * a new adapter rather than a rewrite.
 */

export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";

export interface BillingEvent {
  type: string;
  subscriptionId: string;
  customerId: string;
  userId: string;
  productId?: string;
  currentPeriodEnd?: string;
}

export interface EntitlementChange {
  userId: string;
  subscriptionId: string;
  customerId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
}

/**
 * Product id → tier. A table, so adding a plan is a line here rather than a
 * conditional buried in a route handler.
 */
export const PRODUCT_TIERS: Record<string, SubscriptionTier> = {
  finlio_pro_monthly: "pro",
  finlio_pro_yearly: "pro",
  finlio_ultra_monthly: "ultra",
  finlio_ultra_yearly: "ultra",
};

const ACTIVATING = new Set([
  "subscription.active",
  "subscription.created",
  "subscription.renewed",
  "payment.succeeded",
]);

const REVOKING = new Set([
  "subscription.cancelled",
  "subscription.expired",
  "subscription.failed",
]);

/**
 * Map an event to what the account should now be entitled to.
 *
 * Returns null for events we do not act on. A payment provider sends far more
 * than we care about, and reacting to an unrecognised event type is how a
 * subscription gets silently revoked.
 */
export function toEntitlementChange(event: BillingEvent): EntitlementChange | null {
  const known = ACTIVATING.has(event.type) || REVOKING.has(event.type);
  if (!known) return null;

  const revoked = REVOKING.has(event.type);
  const tier = event.productId ? PRODUCT_TIERS[event.productId] : undefined;

  // An unknown product on an activating event must not silently grant a tier.
  if (!revoked && !tier) return null;

  return {
    userId: event.userId,
    subscriptionId: event.subscriptionId,
    customerId: event.customerId,
    tier: revoked ? "free" : tier!,
    status:
      event.type === "subscription.cancelled"
        ? "cancelled"
        : event.type === "subscription.expired"
          ? "expired"
          : event.type === "subscription.failed"
            ? "past_due"
            : "active",
    currentPeriodEnd: event.currentPeriodEnd ? new Date(event.currentPeriodEnd) : null,
  };
}
