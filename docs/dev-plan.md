# Finlio — Development Plan

The abstract, all-phases roadmap. Each phase has its own detailed, checkbox-tracked
doc (`phase-1.md`, `phase-2.md`, …) that the two devs maintain and tick off as work
lands. This file stays high-level; the phase docs hold the actual tasks.

- **What we build:** [`PRD.md`](./PRD.md)
- **How we build it:** [`TECHSTACK.md`](./TECHSTACK.md)
- **System design:** [`architecture.md`](./architecture.md) + [`adr/`](./adr)
- **Phase 1 detail:** [`phase-1.md`](./phase-1.md) *(complete)*
- **Phase 2 detail (current):** [`phase-2.md`](./phase-2.md)
- **Local dev DB:** [`local-supabase.md`](./local-supabase.md)

**Positioning:** **India-first, global later**, and **web/desktop first, mobile
(iOS + Android) at scale**. Phases reflect this — the web product lands before
the React Native apps.

---

## Team & working model

Both are **owners**; the build splits by **strength**:

| Dev | Owns |
|---|---|
| **Gokulakrishnan** (primary — builds most of the product; strength in AI) | The bulk of the build across phases — product features, backend, and the AI Core |
| **Beny Dishon K** (foundations + polish) | Phase 1 foundation: Supabase + Drizzle (local dev → prod) through to the waitlist persisting in **prod Supabase**. UI/design polish thereafter |

**How the two run in parallel.** Beny drove the **Phase 1 foundation** — standing up
Supabase + Drizzle in local dev and pushing until the waitlist persisted in **prod
Supabase** — and has now shifted to **polish** on the product surface. Gokul owns most
of Phase 2+ (product + AI Core); the AI Core groundwork (LLM adapter, prompts, evals
in `packages/core`) needs no UI and doesn't depend on the Supabase work, so it runs in
parallel from day one. The one seam to agree up front is **the shape of agent output**
— a shared Zod schema for briefs/reports — so the agents and the screens speak the
same format (`SCHEMA-6` in [`phase-2.md`](./phase-2.md)).

> Each phase doc has an **Owner** column and per-task checkboxes so **both devs tick
> off their own tasks in the same doc**; land code via PRs (not doc edits). This
> split is the default, not a wall — ownership can be swapped per task by preference.

**Cadence:** single trunk `main`, **protected — all changes via PR, no direct
pushes (admins included).** Short-lived feature branches → PR → CI green → squash
merge (branch auto-deleted). **Conventional Commits enforced** (Lefthook +
commitlint in CI). Weekly dependency PRs via Dependabot. See
[`CLAUDE.md`](../CLAUDE.md) for the full rules.

**Definition of Done (every task):** code + tests (where logic exists) + typecheck
+ lint pass in CI; docs/`.env.example` updated if config changed; the phase-doc
checkbox ticked with the merging PR linked.

---

## Where we are today (baseline)

**Phase 1 is done; [Phase 2](./phase-2.md) is the current phase.**

The repo is a **Turborepo + pnpm monorepo** ([ADR-0001](./adr/0001-monorepo-turborepo-pnpm.md)):
the Next.js 16.3 / React 19 / Tailwind v4 waitlist landing page lives in `apps/web`,
with `packages/core`, `packages/schemas`, and `packages/tokens` seeded empty. What
Phase 1 actually shipped:

- **Waitlist persists to Supabase** — a `subscribers` table via **Drizzle**, RLS
  enabled with no public policies (all writes server-side) — and still sends the
  **Resend** confirmation email; the inbound relay is signature-verified.
- **CI gates every PR** on `Lint · Typecheck · Test · Build` with branch protection,
  Conventional Commits (Lefthook + commitlint), coverage reporting, and Dependabot.
- **Vitest** (node + jsdom projects) covering the waitlist action, email libs, and
  landing components.
- **PostHog** wired behind the consent gate with the waitlist funnel.
- **Design tokens finalised** on the shipped landing palette (PRD §9), with
  **shadcn + Base UI** on top and the app shell (header/nav/footer) in place.
- **Local Supabase** from a one-command setup ([`local-supabase.md`](./local-supabase.md)).

There is still **no auth, no product schema, and no signed-in app** — that is Phase 2,
tracked in [`phase-2.md`](./phase-2.md).

---

## Phase overview

### Phase 1 — Landing, Waitlist & Foundations  *(detailed in [`phase-1.md`](./phase-1.md))*
Make the public surface solid and lay the engineering foundations — no product app
yet, nothing fancy. Landing page + **waitlist + email infra** (Resend) hardened;
**Supabase** plugged in via **Drizzle ORM** with a forward-named `subscribers` table
(waitlist today, newsletters later) so signups persist; **Vitest** + **PostHog**
wired to the current surface; design tokens finalised and the **app shell**
(shadcn + Base UI) stood up; **CI green** with branch protection. Local Supabase
runs from a documented one-command setup ([`local-supabase.md`](./local-supabase.md)).
**Exit:** a visitor joins the waitlist and it persists to Supabase; confirmation
email sends; CI gates every PR (lint · typecheck · test · build); PostHog funnel +
finalised design tokens live; local Supabase documented.

### Phase 2 — Product Foundation  *(current — detailed in [`phase-2.md`](./phase-2.md))*
Turn the landing page into a signed-in product. Supabase **Auth** (email OTP +
Google + Apple) and the product schema (`profiles`, `subscriptions`, `goals`,
`snapshots`, `brief_logs`) via Drizzle with **RLS on every table**; the on-device
**Markdown store** abstraction; manual asset/liability entry; first **net-worth
dashboard**; Zerodha/Groww **CSV import**; static goals; **Sentry**; and
**DodoPayments** scaffolding (not yet charging).
**Exit:** a signed-in user can enter assets/liabilities (stored on-device) and see
their real net worth on web.

### Phase 3 — AI Core
The agents and the daily value loop. QStash scheduling → API-route jobs; Market
Monitor + **market-morning brief** (the wedge) by email; Expense Analyser; Goal
Coach; Reminder & Action; Financial Health Score; Monthly Report (email + PDF via
Resend). LLM adapter (Claude + Gemini) with guardrails and an eval suite. Playwright
e2e for the core happy path.
**Exit:** users receive a useful daily brief and a monthly report; agents run on
schedule with retries, idempotency, and disclaimers.

### Phase 4 — Pro Growth & Mobile
Monetise and go multi-device. DodoPayments subscriptions live (Free/Pro/Ultra),
tier gating via PostHog flags; Account Aggregator integration (TSP partner) + full
broker CSV coverage; multi-currency NRI mode (USD/SGD/AED + live FX). **React Native
(Expo) app V1**: auth, core dashboard, push notifications, biometric lock, EAS
build → TestFlight/Play.
**Exit:** paying users on web + mobile; AA-connected accounts; NRI multi-currency.

### Phase 5 — Scale & Depth
Family profiles (Ultra, up to 5), goal stress-test simulator, tax module (80C +
capital-gains), WhatsApp alerts (Ultra), home-screen widgets (iOS/Android), Siri/
Assistant shortcuts, regional-language UI (Tamil/Hindi), and the B2B CA/advisor
white-label portal.
**Exit:** family + advisor use-cases and the higher-value Ultra features shipped.

---

## Milestones (target, adjust to reality)

| Milestone | Phase | Signal |
|---|---|---|
| M1 — Waitlist + foundations live | 1 | Waitlist persists to Supabase; CI gating PRs; PostHog + tokens live |
| M2 — Product foundation | 2 | Auth + net-worth dashboard on `main` |
| M3 — Daily value | 3 | Morning brief + monthly report shipping to real users |
| M4 — Revenue + mobile | 4 | First paid subscriptions; RN app in TestFlight/Play |
| M5 — Depth | 5 | Family profiles, tax module, WhatsApp, widgets |

---

## Cross-cutting, every phase

- **Privacy first** — raw data on-device; cloud opt-in and E2E-encrypted.
- **Suggest, never execute** — no trades, no fund movement, disclaimers on AI output.
- **Tests + CI green** before merge; Dependabot kept current.
- **Analytics on new surfaces** — instrument the funnel as features ship.
- **Docs stay live** — update PRD/TECHSTACK/phase docs with the code that changes them.

---

## How to use the phase docs

1. Open the current phase doc (e.g. `phase-1.md`).
2. Claim a task (put your name in **Owner**), open a branch, do the work.
3. Land a PR; when it merges, tick the checkbox and link the PR.
4. When all P0 tasks in a phase are ticked and the exit criteria hold, spin up the
   next `phase-N.md` from the abstract above and repeat.
