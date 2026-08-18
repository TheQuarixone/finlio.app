import { INBOUND_ADDRESSES, wouldLoop } from "@/lib/inbound";
import { getResend } from "@/lib/resend";

// Mail sent to any of our published addresses (hello@, privacy@, grievance@ —
// see lib/inbound) is relayed here. Resend's own inbound MX (finlio.app ->
// Resend, verified in the Resend dashboard) covers the whole domain and
// delivers this webhook for every "email.received" event, so a new address
// needs no new plumbing: add it to INBOUND_ADDRESSES and it is published and
// relayed like the rest. There is no mailbox to poll and no DNS forwarding
// rule to keep in sync.
// Destination for relayed inbound mail. No default — if it isn't set, we
// acknowledge the webhook and skip forwarding.
const FORWARD_TO = process.env.INBOUND_FORWARD_TO;
const FORWARD_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Finlio <hello@finlio.app>";

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RESEND_WEBHOOK_SECRET is not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing signature headers" }, { status: 400 });
  }

  let event;
  try {
    event = getResend().webhooks.verify({
      payload,
      headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret,
    });
  } catch (err) {
    console.error("Resend webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    // Ignore other event types in case this endpoint is later subscribed to more.
    return Response.json({ received: true });
  }

  if (!FORWARD_TO) {
    console.warn("INBOUND_FORWARD_TO not set — acknowledging without forwarding");
    return Response.json({ received: true });
  }

  /* Forwarding to one of our own inbound addresses would bounce the message
     back through this webhook forever. Acknowledge so Resend stops retrying,
     and make the misconfiguration loud in the logs instead. */
  if (wouldLoop(FORWARD_TO)) {
    console.error(
      `INBOUND_FORWARD_TO (${FORWARD_TO}) is one of our own inbound addresses ` +
        `(${INBOUND_ADDRESSES.join(", ")}). Refusing to forward: this would loop.`
    );
    return Response.json({ received: true });
  }

  /* Which address it was sent to matters for triage: a privacy request runs on
     a 30-day clock and a grievance on 90. `passthrough` keeps the original
     headers, so the To: line survives into the forwarded copy; this is just for
     the logs. */
  console.info(`Relaying inbound mail addressed to: ${event.data.to.join(", ")}`);

  try {
    await getResend().emails.receiving.forward({
      emailId: event.data.email_id,
      to: FORWARD_TO,
      from: FORWARD_FROM,
      passthrough: true,
    });
  } catch (err) {
    console.error("Failed to forward inbound email:", err);
    return Response.json({ error: "Forward failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
