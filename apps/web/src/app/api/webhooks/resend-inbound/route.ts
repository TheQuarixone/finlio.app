import { getResend } from "@/lib/resend";

// Mail sent to hello@finlio.app is relayed here. Resend's own inbound MX
// (finlio.app -> Resend, verified in the Resend dashboard) delivers this
// webhook for every "email.received" event; there is no separate mailbox to
// poll or DNS forwarding rule to keep in sync.
// Destination for relayed inbound mail. Must differ from the inbound address
// (hello@finlio.app) or forwarding would loop, so there is no default — if it
// isn't set, we acknowledge the webhook and skip forwarding.
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
