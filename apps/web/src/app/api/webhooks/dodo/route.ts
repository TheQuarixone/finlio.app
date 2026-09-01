import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { type BillingEvent, toEntitlementChange } from "@finlio/core/services";
import { applyEntitlementChange } from "@finlio/data/repositories";

/**
 * DodoPayments webhook (PAY-2).
 *
 * REST rather than tRPC because the caller is external and its shape is not
 * ours (ADR-0002). Three properties this endpoint must have, in order:
 *
 * 1. **Signature-verified.** It is a public URL that grants paid tiers. An
 *    unverified one lets anyone upgrade themselves with a curl command.
 * 2. **Idempotent.** Providers redeliver on timeout. The write upserts on the
 *    provider's subscription id, so a redelivery converges instead of stacking.
 * 3. **Fails loudly to the provider, quietly to the world.** A 5xx makes the
 *    provider retry, which is what we want; the response body never explains
 *    why, because that is a probing oracle.
 */

export const dynamic = "force-dynamic";

function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  // Providers vary on prefixes ("sha256=") and casing.
  const provided = header.replace(/^sha256=/i, "").trim().toLowerCase();

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  // Length must match before timingSafeEqual, which throws otherwise — and the
  // comparison itself is constant-time so a wrong signature cannot be found by
  // measuring how long the rejection took.
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) {
    // Refuse rather than accept unverified events if the secret is missing.
    console.error("DODO_WEBHOOK_SECRET is not set; rejecting webhook.");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // The raw body, before any parsing — the signature covers exact bytes.
  const raw = await request.text();
  const signature =
    request.headers.get("webhook-signature") ?? request.headers.get("dodo-signature");

  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(raw);
  } catch {
    // Signed but unparseable: accept so the provider stops retrying, since a
    // retry will not fix malformed JSON.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const data = payload.data ?? {};
  const event: BillingEvent = {
    type: payload.type ?? "",
    subscriptionId: String(data.subscription_id ?? ""),
    customerId: String(data.customer_id ?? ""),
    userId: String((data.metadata as Record<string, unknown> | undefined)?.user_id ?? ""),
    productId: data.product_id ? String(data.product_id) : undefined,
    currentPeriodEnd: data.current_period_end ? String(data.current_period_end) : undefined,
  };

  const change = toEntitlementChange(event);

  // Unrecognised event types are acknowledged and ignored. Treating them as
  // failures would make the provider retry forever over something we will never
  // act on.
  if (!change || !change.userId || !change.subscriptionId) {
    return NextResponse.json({ received: true, applied: false }, { status: 200 });
  }

  try {
    await applyEntitlementChange(change);
  } catch (cause) {
    // 5xx so the provider retries — losing an upgrade silently is worse than a
    // duplicate delivery, which the upsert already handles.
    console.error("Failed to apply entitlement change:", cause);
    return NextResponse.json({ error: "apply_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, applied: true }, { status: 200 });
}
