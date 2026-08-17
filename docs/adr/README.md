# Architecture Decision Records (ADRs)

Short, dated records of **significant** architectural decisions — the choice, why we
made it, and its consequences — so the reasoning survives past the conversation it
came from. Read these alongside [`../architecture.md`](../architecture.md).

## Index

| # | Decision | Status |
|---|---|---|
| [0001](./0001-monorepo-turborepo-pnpm.md) | Monorepo with Turborepo + pnpm | Accepted |
| [0002](./0002-api-boundary.md) | API boundary: tRPC for app data, REST for webhooks/integrations | Accepted |
| [0003](./0003-subscriber-storage-and-sending.md) | Subscriber storage: own the data (Supabase), rent the sending (Resend) | Accepted |

## Writing a new ADR

Copy the shape of an existing one: **Context → Decision → Consequences →
Alternatives considered**. Number it sequentially, set a status
(Proposed / Accepted / Superseded), and add it to the index above. Supersede rather
than delete — keep the history.
