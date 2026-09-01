import { describe, expect, it } from "vitest";
import { toEntitlementChange, type BillingEvent } from "./billing";

const base: BillingEvent = {
  type: "subscription.active",
  subscriptionId: "sub_1",
  customerId: "cus_1",
  userId: "user-1",
  productId: "finlio_pro_monthly",
  currentPeriodEnd: "2026-10-01T00:00:00.000Z",
};

describe("toEntitlementChange", () => {
  it("grants the tier the product maps to", () => {
    expect(toEntitlementChange(base)).toMatchObject({ tier: "pro", status: "active" });
  });

  it("maps the ultra product", () => {
    expect(toEntitlementChange({ ...base, productId: "finlio_ultra_yearly" })).toMatchObject({
      tier: "ultra",
    });
  });

  it("revokes to free on cancellation", () => {
    expect(toEntitlementChange({ ...base, type: "subscription.cancelled" })).toMatchObject({
      tier: "free",
      status: "cancelled",
    });
  });

  it("marks a failed payment past_due without revoking outright", () => {
    expect(toEntitlementChange({ ...base, type: "subscription.failed" })).toMatchObject({
      status: "past_due",
    });
  });

  it("ignores event types we do not act on", () => {
    // Reacting to unrecognised events is how a subscription gets silently revoked.
    expect(toEntitlementChange({ ...base, type: "invoice.viewed" })).toBeNull();
  });

  it("never grants a tier for an unknown product", () => {
    // A typo'd or spoofed product id must not become an entitlement.
    expect(toEntitlementChange({ ...base, productId: "finlio_free_forever" })).toBeNull();
    expect(toEntitlementChange({ ...base, productId: undefined })).toBeNull();
  });

  it("still revokes when the product is unknown", () => {
    // Revocation should never be blocked by a product we cannot map.
    expect(
      toEntitlementChange({ ...base, type: "subscription.expired", productId: "mystery" })
    ).toMatchObject({ tier: "free", status: "expired" });
  });

  it("tolerates a missing period end", () => {
    expect(toEntitlementChange({ ...base, currentPeriodEnd: undefined })).toMatchObject({
      currentPeriodEnd: null,
    });
  });
});
