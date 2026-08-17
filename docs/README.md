# Finlio — Docs

Planning and reference docs for Finlio. Start here.

| Doc | Purpose |
|---|---|
| [`PRD.md`](./PRD.md) | **What** we build — product spec, features, tiers, agents, KPIs. |
| [`TECHSTACK.md`](./TECHSTACK.md) | **How** we build it — architecture, stack, testing, CI/CD, ops. |
| [`architecture.md`](./architecture.md) | **System design** — monorepo, the web↔mobile reuse boundary, API layering. Read before designing a feature. |
| [`adr/`](./adr) | **Decision records** — why we chose the monorepo, the API boundary, etc. |
| [`dev-plan.md`](./dev-plan.md) | **When** — abstract roadmap across all phases. |
| [`phase-1.md`](./phase-1.md) | Detailed, checkbox-tracked task board for Phase 1. |
| [`local-supabase.md`](./local-supabase.md) | **Local dev DB** — run Supabase locally + apply Drizzle migrations. |

Later phases get their own `phase-N.md`, created from the abstract in
[`dev-plan.md`](./dev-plan.md) as each phase begins.

**Repo facts:** the single default branch is `main`. (The earlier `production`,
`docs`, and `email-templates` branches were consolidated into `main` and deleted;
the `email-templates` work — `finlio_waitlist_emailtemplate.html` — was preserved.)
Dependabot's `dependabot/*` PR branches are automated and expected. CI + Dependabot
live under [`.github/`](../.github/).
