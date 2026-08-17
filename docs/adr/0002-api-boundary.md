# ADR-0002 — API boundary: tRPC for app data, REST for webhooks/integrations

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** Gokulakrishnan, team

## Context

Web and mobile must share business logic. The biggest lock-in risk is **where the
API boundary sits**:

- **Next.js Server Actions are web-only.** React Native **cannot** invoke them.
  If Phase-1 web mutations/data live in Server Actions, none of it is reusable by
  the mobile app — a guaranteed rewrite.
- Some endpoints must be REST regardless: third-party **webhooks** (Resend inbound,
  DodoPayments), **scheduled job callbacks** (QStash), and **Account Aggregator**
  flows.

## Decision

1. **Business logic lives in a service layer in `packages/core`** — framework-
   agnostic, no `next/*` imports.
2. **App data is exposed via tRPC** (`packages/api`): one typed router, consumed by
   the web client and the React Native client alike. End-to-end types, no codegen.
3. **Webhooks and third-party integrations are REST route handlers** under
   `apps/web/app/api/*` (Resend, QStash, DodoPayments, Account Aggregator).
4. **Server Actions are thin wrappers** over the service layer, reserved for
   progressive-enhancement forms (e.g. the current waitlist). They hold **no** logic
   the mobile app would also need.

## Consequences

**Positive**
- Mobile calls the same tRPC router as web — zero business-logic duplication.
- Clear separation: typed internal API (tRPC) vs. externally-shaped REST (webhooks).
- Server Actions still give the web nice progressive-enhancement forms.

**Negative / costs**
- tRPC couples client and server types (intentional) and adds a dependency + a bit
  of setup (router, context, client).
- Two transport styles to maintain (tRPC + REST) — but they serve genuinely
  different callers.

## Alternatives considered

- **Server Actions everywhere.** Rejected — not callable from React Native; the
  core rewrite risk.
- **REST route handlers for everything, no tRPC.** Viable and more "standard"/
  decoupled, but loses end-to-end type safety and costs more boilerplate + a shared
  client. We prefer tRPC for internal app data velocity, REST only where the caller
  is external.
- **GraphQL.** Heavier than needed for a small team; tRPC gives типed DX without a
  schema layer to run.

## Notes

Keep the tRPC router thin — it validates input (Zod from `packages/schemas`), checks
auth, and calls `packages/core`. Business rules never live in the router.
