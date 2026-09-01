# ADR-0004 — What may leave the device

- **Status:** Accepted
- **Date:** 2026-09-01
- **Deciders:** Gokulakrishnan
- **Supersedes/relates:** [ADR-0002](./0002-api-boundary.md), [architecture §4.4](../architecture.md)

## Context

Finlio's central promise is that raw financial data stays on the user's device
(PRD §8, §6.9). "Privacy-first" is easy to write in marketing copy and easy to
erode one pragmatic exception at a time: a sync feature here, an analytics event
there, a support tool that needs "just the totals" to debug.

The erosion is rarely a decision. It happens because nobody wrote down where the
line is, so every new feature re-litigates it from scratch and the answer drifts
toward whatever is convenient that week.

We also cannot put *nothing* on the server. Goals must be reachable by the
Phase-3 agents, which run on a schedule with no access to a browser. Billing
needs an account. So the rule cannot be "nothing leaves"; it has to be specific.

## Decision

**The server may hold derived aggregates and user-authored metadata. It may
never hold a position.**

Concretely:

| May leave the device | Must not leave the device |
|---|---|
| Month-end totals: net worth, total assets, total liabilities, savings rate (`snapshots`) | Any individual holding — ticker, ISIN, folio, quantity, purchase price |
| Goal metadata: name, target amount, deadline (`goals`) | The mapping from a goal to the assets funding it, beyond opaque ids |
| Profile: base currency, risk profile, income band, average monthly expenses (`profiles`) | Account numbers, institution names, property addresses, policy numbers |
| Entitlement state from the payment provider (`subscriptions`) | The `finlio/v1` document, in whole or in part |
| Agent send logs: which job ran, when, status (`brief_logs`) | Anything the encryption key protects |

**Structural enforcement.** There is no `assets` table and no `holdings` table,
and there is no tRPC procedure that accepts one. A future engineer who wants to
sync positions has to add both, which is a visible act rather than a quiet one.

**Corollaries**

1. Anything the server needs that depends on positions is **computed on the
   client and sent as a result**. `goal.plan` takes `saved` as an input for
   exactly this reason — the server plans against a number it cannot derive.
2. Agents receive positions as **transient prompt context**, redacted by
   `redactDocument()` and never persisted. See [ai-policy §3.5](../ai-policy.md).
3. Error and analytics pipelines are covered by the same rule. A holding that
   reaches Sentry has left the device (see `OBS-2`).
4. Opt-in cloud backup, when it ships, is **client-side encrypted before
   upload**. Ciphertext on our storage is not a position leaving the device;
   plaintext would be.

## Consequences

**Positive**
- The privacy claim is checkable rather than aspirational: point at the schema.
- Server-side breach exposure is bounded to aggregates and metadata. An attacker
  with full database access learns that someone has a ₹17L goal, not what they own.
- Forces the client/server split to be deliberate at design time.

**Negative / costs**
- Server-side features that would want positions — cross-device sync, a support
  tool that reproduces a user's dashboard, server-rendered charts — are harder or
  impossible. That is the trade being made, not an oversight.
- Some computation happens twice, or in a less convenient place.
- Aggregates are not nothing. `snapshots` reveals wealth trajectory. It is the
  minimum the product needs and it is worth naming rather than pretending it is
  neutral.

## Alternatives considered

- **Encrypt positions server-side with a user-held key.** Better than plaintext,
  but the server still holds the ciphertext and the shape of it; key management
  becomes a support burden; and it invites "just decrypt it temporarily" during
  an incident. Rejected as a weaker version of not having it.
- **No server state at all.** Clean, but kills scheduled agents (the wedge) and
  billing. Rejected.
- **Case-by-case judgement.** This is the status quo this ADR exists to end.
