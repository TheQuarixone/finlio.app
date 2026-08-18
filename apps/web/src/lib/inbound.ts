/* The addresses that receive mail at finlio.app.

   Resend's inbound MX covers the whole domain, so every one of these lands on
   the same webhook and is relayed to the mailbox we actually read. Listing them
   here keeps two things honest: the legal pages only publish addresses that
   exist, and the relay can refuse to forward mail back into itself. */

export const INBOUND_DOMAIN = "finlio.app";

export const INBOUND_ADDRESSES = [
  "hello@finlio.app",
  "privacy@finlio.app",
  "grievance@finlio.app",
] as const;

/** Pulls the bare address out of "Name <addr@host>" or a plain address. */
export function normaliseAddress(value: string): string {
  const angled = value.match(/<([^>]+)>/);
  return (angled ? angled[1] : value).trim().toLowerCase();
}

export function isInboundAddress(value: string): boolean {
  const address = normaliseAddress(value);
  return INBOUND_ADDRESSES.some((inbound) => inbound === address);
}

/* Forwarding to an address that is itself inbound would bounce the message
   between Resend and us until someone noticed the bill. The relay checks this
   before it sends rather than trusting whoever set the env var. */
export function wouldLoop(forwardTo: string | undefined): boolean {
  if (!forwardTo) return false;
  return forwardTo
    .split(",")
    .some((recipient) => isInboundAddress(recipient));
}
