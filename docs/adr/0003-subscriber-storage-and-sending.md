# ADR-0003 — Subscriber storage: own the data (Supabase), rent the sending (Resend)

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** Gokulakrishnan, Beny Dishon K

## Context

The `subscribers` list starts as the waitlist and becomes the **newsletter / mailing
list** later (see [ADR-0001](./0001-monorepo-turborepo-pnpm.md)-era naming choice:
the table is named `subscribers`, not `waitlist`, for exactly this). We need to
decide **where subscriber data lives** and **who handles bulk sending and
unsubscribes**.

Two facts drive the decision:

- These are **two separable jobs**: the *system of record* (who is on the list,
  their status, how they relate to app users) versus the *sending layer* (bulk
  delivery, deliverability, unsubscribe compliance).
- **Unsubscribe is not just a boolean.** As of Feb 2024, Gmail and Yahoo require
  **one-click unsubscribe** for bulk senders — the `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers per **RFC 8058** — plus a suppression list so we
  never re-mail someone who opted out or hard-bounced. Getting this wrong means
  throttling or spam-foldering.

Today's code repurposes **Resend Contacts** as the store
([`src/lib/waitlist.ts`](../../src/lib/waitlist.ts)) — convenient, but a mailing-list
tool standing in for a database.

## Decision

1. **Supabase `subscribers` (via Drizzle) is the source of truth.** We own the list
   as a first-class business asset: real schema, SQL querying, and joins with app
   users / entitlements. `status` = `waitlist` | `subscribed` | `unsubscribed`.
2. **Resend is the sending + unsubscribe layer**, split by mail type:
   - **Transactional** (waitlist confirmation, receipts, resets) → `resend.emails.send`.
     Always delivered, no unsubscribe.
   - **Marketing** (the newsletter) → **Resend Audiences + Broadcasts**, which
     provide **managed one-click unsubscribe**: Resend injects the unsubscribe link,
     sets the `List-Unsubscribe` headers (RFC 8058), hosts the unsubscribe page, and
     maintains suppression.
3. **Sync keeps Supabase authoritative.** On signup: insert into `subscribers` **and**
   upsert the Resend contact. On unsubscribe (via Resend's hosted one-click):
   Resend fires a `contact.updated` webhook → we mirror `status='unsubscribed'` back
   into Supabase. Sends filter to `subscribed`; Resend suppression is the backstop.
4. **Transactional and marketing stay separate.** Unsubscribing from the newsletter
   must never stop transactional mail, and vice versa.
5. **We do not hand-roll** an unsubscribe endpoint, suppression engine, or
   `List-Unsubscribe` handling. Resend owns that.

## Consequences

**Positive**
- We own the list: it joins with the rest of the app and is portable if we ever
  change the send layer.
- Compliant unsubscribe (Gmail/Yahoo one-click, suppression) without building the
  hard, error-prone parts.
- Single vendor we already use (Resend) for transactional + marketing.

**Negative / costs**
- A **bidirectional sync** to maintain: signup writes two places; a webhook mirrors
  unsubscribes back. A contact now has two representations (DB + Resend) to keep
  consistent.
- Resend Broadcasts has feature limits; a heavy newsletter operation may later want
  a dedicated ESP. Mitigated by Supabase being the source of truth (see below).

## Alternatives considered

- **Resend Contacts as the source of truth.** Rejected — it is a mailing-list tool,
  not a database: no relations, weak querying, and it locks a core asset inside a
  sending vendor. Fine only as a synced mirror.
- **Supabase only, hand-rolled unsubscribe + suppression + `List-Unsubscribe`.**
  Rejected for now — real work and real compliance risk (RFC 8058, Gmail/Yahoo).
  Revisit only if we outgrow Resend's managed flow.
- **A dedicated newsletter platform (Loops / Beehiiv / ConvertKit) from day one.**
  Deferred — adds a vendor; Resend Broadcasts is sufficient at current scale and we
  already run Resend. Because Supabase is the source of truth, we can swap the send
  layer later without losing the list.

## Notes

The current `waitlist.ts` (Resend Contacts as store) is **interim** — Phase 1
replaces it with the Supabase `subscribers` table (see
[`../phase-1.md`](../phase-1.md) §3). The transactional waitlist confirmation stays
on `resend.emails.send` with a react-email template.
