# Finlio — Development Plan

The abstract, all-phases roadmap. Each phase has its own detailed, checkbox-tracked
doc (`phase-1.md`, `phase-2.md`, …) that the two devs maintain and tick off as work
lands. This file stays high-level; the phase docs hold the actual tasks.

- **What we build:** [`PRD.md`](./PRD.md)
- **How we build it:** [`TECHSTACK.md`](./TECHSTACK.md)
- **Phase 1 detail:** [`phase-1.md`](./phase-1.md)

---

## Team & working model

Two developers. Suggested ownership split by workstream (swap per preference):

| Track | Focus | Owner |
|---|---|---|
| **A — Platform/Infra/Backend** | Supabase, auth, API routes, QStash, payments, CI, AI agents | _Dev 1_ |
| **B — Product/Frontend/Mobile** | Web app UI, design system, dashboards, React Native | _Dev 2_ |

> Fill `_Dev 1_` / `_Dev 2_` with real names/handles. Each phase doc has an **Owner**
> column and per-task checkboxes so **both devs tick off their own tasks in the same
> doc**. Keep one phase doc as the shared board; use PRs (not doc edits) to land code.

**Cadence:** trunk-ish flow off `production`. Short-lived feature branches → PR →
CI green → review → merge. Preview deploy per PR. Weekly dependency PRs via
Dependabot. No direct pushes to `production`.

**Definition of Done (every task):** code + tests (where logic exists) + typecheck
+ lint pass in CI; docs/`.env.example` updated if config changed; the phase-doc
checkbox ticked with the merging PR linked.

---

## Where we are today (baseline)

The repo is the **Finlio waitlist landing page** — Next.js 16, React 19, Tailwind
v4, TypeScript, Resend (waitlist + confirmation email + inbound relay). No auth, no
database, no product app yet. Phases build the product app out from this foundation.

---

## Phase overview

### Phase 1 — Foundation & Infrastructure  *(detailed in [`phase-1.md`](./phase-1.md))*
Turn the landing page into a real product foundation. Testing + CI, Supabase auth &
DB, app shell + design tokens, the on-device Markdown store abstraction, manual
asset/liability entry, first net-worth dashboard, Zerodha/Groww CSV import, static
goals, PostHog + Sentry, and DodoPayments scaffolding.
**Exit:** a signed-in user can enter assets/liabilities (stored on-device) and see
their real net worth on web; CI gates every PR; analytics live.

### Phase 2 — AI Core
The agents and the daily value loop. QStash scheduling → API-route jobs; Market
Monitor + **market-morning brief** (the wedge) by email; Expense Analyser; Goal
Coach; Reminder & Action; Financial Health Score; Monthly Report (email + PDF via
Resend). LLM adapter (Claude + Gemini) with guardrails and an eval suite. Playwright
e2e for the core happy path.
**Exit:** users receive a useful daily brief and a monthly report; agents run on
schedule with retries, idempotency, and disclaimers.

### Phase 3 — Pro Growth & Mobile
Monetise and go multi-device. DodoPayments subscriptions live (Free/Pro/Ultra),
tier gating via PostHog flags; Account Aggregator integration (TSP partner) + full
broker CSV coverage; multi-currency NRI mode (USD/SGD/AED + live FX). **React Native
(Expo) app V1**: auth, core dashboard, push notifications, biometric lock, EAS
build → TestFlight/Play.
**Exit:** paying users on web + mobile; AA-connected accounts; NRI multi-currency.

### Phase 4 — Scale & Depth
Family profiles (Ultra, up to 5), goal stress-test simulator, tax module (80C +
capital-gains), WhatsApp alerts (Ultra), home-screen widgets (iOS/Android), Siri/
Assistant shortcuts, regional-language UI (Tamil/Hindi), and the B2B CA/advisor
white-label portal.
**Exit:** family + advisor use-cases and the higher-value Ultra features shipped.

---

## Milestones (target, adjust to reality)

| Milestone | Phase | Signal |
|---|---|---|
| M1 — Foundation live | 1 | Auth + net-worth dashboard on `production`, CI gating PRs |
| M2 — Daily value | 2 | Morning brief + monthly report shipping to real users |
| M3 — Revenue + mobile | 3 | First paid subscriptions; RN app in TestFlight/Play |
| M4 — Depth | 4 | Family profiles, tax module, WhatsApp, widgets |

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
