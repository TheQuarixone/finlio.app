# Phase 2 — Product Foundation

Detailed, checkbox-tracked task board for Phase 2, created from the abstract in
[`dev-plan.md`](./dev-plan.md) now that [`phase-1.md`](./phase-1.md) is green. Both
devs work in **this same doc**: claim a task by putting your handle in **Owner**,
and tick the box when the PR merges (link it). Read
[`architecture.md`](./architecture.md) (especially §4.1 and §5) and
[`adr/0002-api-boundary.md`](./adr/0002-api-boundary.md) **before** writing code —
this is the phase where the web↔mobile seams get set, and getting them wrong is the
expensive mistake.

**Goal:** turn the landing page into a **signed-in product**. Supabase **Auth**
(email OTP + Google + Apple) behind an injectable storage adapter; the product
schema (`profiles`, `subscriptions`, `goals`, `snapshots`, `brief_logs`) via Drizzle
with **RLS on every table**; the **tRPC** boundary (`packages/api`) over a service
layer in `packages/core`; the on-device **`MarkdownStore`** abstraction + web
adapter; manual asset/liability entry feeding a tested **net-worth engine** and the
first **dashboard**; Zerodha/Groww **CSV import**; **static goals**; **Sentry**; and
**DodoPayments scaffolding** (not yet charging). In parallel, the **AI Core
groundwork that needs no UI** — LLM adapter, prompt skeletons, eval-suite stub.

**Exit criteria:**
- A **signed-in** user can enter assets and liabilities (stored **on-device**,
  encrypted) and see their **real net worth** on web.
- Auth is **Supabase JWT with an injectable storage adapter** — the web adapter is
  one implementation, not the only possible one.
- Every product table exists via Drizzle migrations with **RLS enabled and an
  owner-only policy**; migrations apply in CI against the preview DB.
- App data flows over **tRPC** from `packages/api`; **all** business logic lives in
  `packages/core`; Server Actions remain thin wrappers.
- `MarkdownStore` is an **interface** with a passing conformance suite; the web
  adapter (OPFS/IndexedDB + WebCrypto) is one implementation of it.
- The net-worth engine, goal planner, CSV parsers, and `finlio/v1` parser are pure
  `packages/core` code with **Vitest** coverage.
- Shared **Zod schemas** in `packages/schemas` — including the **agent-output
  schema** both the agents and the screens read.
- **Sentry** live, with financial values scrubbed from every event.
- CI stays green (`Lint · Typecheck · Test · Build`); branch protection unchanged.

> **Currently executing: [`phase-2.1.md`](./phase-2.1.md)** — the foundations slice
> (`PKG-*`, `SCHEMA-*`, `AUTH-*`, `DB-7`, `AI-1`–`AI-3`), with the implementation
> detail, PR sequence, and the design decisions behind it. Tick tasks in both docs.

**How to read the tables**
- **Owner:** `_` = unclaimed. Put your handle in.
- **Track:** A = Platform/Infra/Backend · B = Product/Frontend.
- **Pri:** P0 = required to exit Phase 2 · P1 = nice-to-have this phase.
- Tick `[x]` and link the PR when done. `[~]` = deliberately deferred, with a reason.

> **Ownership this phase:** **Gokul drives Phase 2** — the product foundation
> (auth, schema, API boundary, Markdown store, net worth, CSV, goals) **and** the
> AI Core groundwork, which needs no UI and can run in parallel from day one.
> **Beny shifts to polish** — design/UI refinement on the product surface, the
> Phase-1 carry-overs below, and the preview/CI database plumbing. The one seam the
> two must agree **before** either side builds against it is **`SCHEMA-6`, the
> agent-output schema** — the shape briefs and reports arrive in, so the agents and
> the screens speak the same format.
>
> `DB-*` IDs continue from Phase 1 (which used `DB-1`–`DB-6`) so an ID means one
> thing across both docs.

---

## 0. Carry-over from Phase 1 (not the main work)

Phase 1 exited with these open. They are **background chores**, not Phase-2
priorities — none of them blocks the product foundation. `DB-1`/`DB-5` are the
exception: the preview Supabase project is a prerequisite for `DB-14`.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | DB-1b | Create the **preview** Supabase project; add its keys to Vercel + GitHub secrets | Beny | A | P0 |
| [ ] | REPO-2 | Rename local working folder `finchai` → `finlio`; update local scripts/paths | _ | A | P1 |
| [ ] | REPO-3b | Finish `.env.example` — Sentry / QStash / Dodo / LLM keys (see `OBS-5`) | _ | A | P1 |
| [ ] | WL-3b | Live end-to-end test of the Resend inbound relay (real mail to `hello@finlio.app`) | Beny | A | P1 |
| [~] | WL-4 | **Turnstile** on the waitlist form *Still deferred — revisit only if bot signups appear in `subscribers`.* | _ | A | P1 |
| [ ] | UI-4b | Dark-mode **toggle** (token sets already exist; deferred in Phase 1 pending a dark design) | Beny | B | P1 |
| [ ] | REPO-6 | Delete the stray untracked root `package-lock.json` and keep `pnpm` the only package manager | _ | A | P1 |

---

## 1. Workspace packages & seams (`PKG-*`)

The packages the rest of the phase lands in. Do this first — everything below
imports from here.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | PKG-1 | Add **`packages/config`** (shared eslint / tsconfig / Tailwind preset); point `apps/web` at it | _ | A | P0 |
| [ ] | PKG-2 | Add **`packages/data`** — Drizzle schema + Supabase access + the `MarkdownStore` interface | _ | A | P0 |
| [ ] | PKG-3 | Add **`packages/api`** — the tRPC router + typed client | _ | A | P0 |
| [ ] | PKG-4 | Turbo pipeline covers packages: `lint` / `typecheck` / `test` per package; Vitest configured in `core` + `schemas` | _ | A | P0 |
| [ ] | PKG-5 | **Purity guard** — a lint rule or test asserting `packages/core` imports no `next/*`, no React, no platform APIs ([architecture §4.2](./architecture.md)) | _ | A | P0 |
| [ ] | PKG-6 | Extract design **token values** into `packages/tokens` and generate the Tailwind preset from them, so `globals.css` stops being the source of truth (the RN theme reads the same values later) | _ | B | P1 |

---

## 2. Auth (`AUTH-*`)

PRD §6.1 `ON-1`. The **injectable storage adapter** is the load-bearing part — web
stores the session in cookies, mobile will use Expo SecureStore, same client.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | AUTH-1 | Enable Supabase **Auth** on local + prod projects; configure redirect URLs, email OTP templates, session/JWT lifetimes | _ | A | P0 |
| [ ] | AUTH-2 | **Supabase client in `packages/data` taking an injected storage adapter** (`getItem`/`setItem`/`removeItem`); web adapter = cookie storage via `@supabase/ssr`. No `next/*` inside the client itself | _ | A | P0 |
| [ ] | AUTH-3 | **Email OTP** sign-in end-to-end (request code → verify → session) | _ | A | P0 |
| [ ] | AUTH-4 | **Google** OAuth provider wired and tested | _ | A | P0 |
| [ ] | AUTH-5 | Server-side session read in RSC + route protection for `/app/*` (unauthenticated → sign-in, preserving intent) | _ | A | P0 |
| [ ] | AUTH-6 | Sign-in / verify / sign-out screens on the existing shell (Gokul builds, Beny polishes) | _ | B | P0 |
| [ ] | AUTH-7 | `profiles` row created on first sign-in, via the service layer (not a Server Action) | _ | A | P0 |
| [ ] | AUTH-8 | Auth tests with Supabase mocked: session present/absent, expiry, sign-out, protected-route redirect | _ | A | P0 |
| [ ] | AUTH-9 | **Apple** Sign-in provider. *P1 only because it is blocked on Apple Developer Program enrolment and is mandatory for the App Store in Phase 4 — the adapter seam (`AUTH-2`) is what Phase 2 must get right, the provider itself is configuration.* | _ | A | P1 |
| [ ] | AUTH-10 | Onboarding: base currency, risk profile, income, avg monthly expenses (PRD `ON-2`) | _ | B | P1 |
| [ ] | AUTH-11 | Account deletion + full data export (PRD §8 data rights) | _ | A | P1 |

---

## 3. Product schema + RLS (`DB-*`)

PRD §6.9 / TECHSTACK §5.1. **RLS on every table, no exceptions.** Only *derived*
data goes to Postgres — raw holdings stay on-device (`DB-15`).

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | DB-7 | Move the Drizzle schema + typed client from `apps/web/src/db` into **`packages/data`**; `apps/web` re-exports | _ | A | P0 |
| [ ] | DB-8 | **`profiles`** — `user_id` → `auth.users`, base currency, risk profile, annual income, avg monthly expenses, timestamps | _ | A | P0 |
| [ ] | DB-9 | **`subscriptions`** — tier, status, Dodo customer/subscription ids, current period end. **Server-written only** (webhook), clients read | _ | A | P0 |
| [ ] | DB-10 | **`goals`** — name, target amount, deadline, currency, linked-asset ids, timestamps | _ | A | P0 |
| [ ] | DB-11 | **`snapshots`** — month, net worth, total assets, total liabilities, savings rate. **Aggregates only, never raw holdings** | _ | A | P0 |
| [ ] | DB-12 | **`brief_logs`** — user, job, run key, sent_at, status. Phase 3 writes it; the table + RLS land now so the agents have somewhere to go | _ | A | P0 |
| [ ] | DB-13 | **RLS enabled + owner-only policy on every new table**, plus a test that fails if any table in the schema has RLS off | _ | A | P0 |
| [ ] | DB-14 | Migrations generated and **applied in CI against the preview DB** (closes the Phase-1 `DB-5` gap; needs `DB-1b`) | _ | A | P0 |
| [ ] | DB-15 | **ADR-0004 — what may leave the device.** Write down the rule: raw holdings never reach the server; only derived aggregates (`snapshots`) and metadata (`goals`) do. Everything below depends on this being settled | _ | A | P0 |
| [ ] | DB-16 | Enable **pgvector** on the product project (Phase 3 retrieval needs it; enabling early avoids a migration then) | _ | A | P1 |

---

## 4. API boundary — tRPC + service layer (`API-*`)

[ADR-0002](./adr/0002-api-boundary.md). The router validates, authenticates, and
calls `packages/core`. **Business rules never live in the router, and never in a
Server Action.**

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | API-1 | tRPC router in **`packages/api`**: context (verify the Supabase JWT → `userId`), `publicProcedure` / `protectedProcedure`, Zod input validation from `packages/schemas` | _ | A | P0 |
| [ ] | API-2 | Mount it at `apps/web/app/api/trpc/[trpc]/route.ts` | _ | A | P0 |
| [ ] | API-3 | Typed client + query provider in `apps/web`; **no component or page touches Drizzle/Supabase directly** | _ | A | P0 |
| [ ] | API-4 | **Service layer in `packages/core/src/services/*`** — profile, goals, snapshots, entitlements. Routers are ~10 lines each | _ | A | P0 |
| [ ] | API-5 | Audit existing Server Actions: `joinWaitlist` stays a thin wrapper; document the rule so nothing new grows logic there | _ | A | P0 |
| [ ] | API-6 | Error mapping (`TRPCError` → user-safe copy) and a shared **not-investment-advice** disclaimer helper | _ | A | P1 |
| [ ] | API-7 | Rate limiting on protected procedures (Upstash Redis) | _ | A | P1 |

---

## 5. Shared Zod schemas (`SCHEMA-*`)

`packages/schemas` is the **one source of truth for shapes** — the API, the
Markdown store, the CSV importers, and the agents all validate against it.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | SCHEMA-1 | Stand up `packages/schemas` — Zod, exported barrel, Vitest | _ | A | P0 |
| [ ] | SCHEMA-2 | **Money primitives** — integer minor units + currency code, INR default. No floats for money anywhere in the codebase | _ | A | P0 |
| [ ] | SCHEMA-3 | **Asset + liability schemas** covering the PRD Appendix A classes: equity, mutual funds, fixed deposits, real estate, cash, EPF/PPF/NPS, SGB, insurance | _ | A | P0 |
| [ ] | SCHEMA-4 | **Goal schema** (name, target, deadline, linked assets, progress) | _ | A | P0 |
| [ ] | SCHEMA-5 | **`finlio/v1` document schema** — frontmatter + section shapes, the contract the parser/serializer round-trips (PRD Appendix A) | _ | A | P0 |
| [ ] | SCHEMA-6 | **Agent-output schema — the Gokul↔Beny seam.** One envelope for briefs and reports: sections, per-item one-liners, ₹ amounts as money primitives, disclaimer, `generatedAt`, model + prompt version. **Agree this before either side builds against it**; the agents validate outputs into it (`AI-5`) and the screens render from it | Gokul + Beny | A | P0 |
| [ ] | SCHEMA-7 | Versioning strategy for `finlio/v1` — how a stored document is upgraded when the schema moves (architecture §7 open question) | _ | A | P1 |

---

## 6. On-device Markdown store (`STORE-*`)

The privacy core (architecture §4.4, TECHSTACK §5.2). **Nail the interface before
writing either adapter** — mobile implements the same one in Phase 4.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | STORE-1 | **ADR-0005 — what "on-device" means on the web.** Resolve the PRD §14 open question: OPFS primary with an IndexedDB fallback, encrypted client-side, no server copy by default. Blocks `STORE-4` | _ | A | P0 |
| [ ] | STORE-2 | **`MarkdownStore` interface** in `packages/data` — `read` / `write` / `list` / `delete`, storage-agnostic, zero browser APIs in the signature | _ | A | P0 |
| [ ] | STORE-3 | **`finlio/v1` parser + serializer** in `packages/core` — pure functions, table round-trip, Vitest incl. malformed input | _ | A | P0 |
| [ ] | STORE-4 | **Web adapter** — OPFS/IndexedDB + WebCrypto **AES-GCM**; the key is derived client-side and **never sent to the server** | _ | A | P0 |
| [ ] | STORE-5 | **Key lifecycle, documented** — where the key comes from, what happens on a second device, and what happens when it is lost. Ship nothing that writes encrypted data until this is written down | _ | A | P0 |
| [ ] | STORE-6 | **In-memory adapter + conformance test suite** every adapter must pass — the mobile adapter reuses it verbatim in Phase 4 | _ | A | P0 |
| [ ] | STORE-7 | Export / import the raw `.md` file (data-rights obligation and the user's escape hatch) | _ | B | P1 |

---

## 7. Net worth — engine + dashboard (`NW-*`)

PRD §6.2. The engine is pure `packages/core`; the dashboard is a thin view over it.
**Live market prices are not in this phase** — values are user-entered, behind a
provider interface so live pricing drops in later without a rewrite.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | NW-1 | **Net-worth engine in `packages/core`** — assets − liabilities in base currency, per-class aggregation, Vitest on the math (target ≥ 90% on this module) | _ | A | P0 |
| [ ] | NW-2 | **Valuation provider interface** — `manual` implementation now; live NSE/BSE/NAV/gold adapters plug in later (PRD `IN-1`, Phase 3+) | _ | A | P0 |
| [ ] | NW-3 | Asset-allocation breakdown across classes (the data behind the pie/treemap) | _ | A | P0 |
| [ ] | NW-4 | `/app` shell + routes behind auth — dashboard layout, nav, signed-in chrome (Gokul builds, Beny polishes) | _ | B | P0 |
| [ ] | NW-5 | **Manual asset entry** — guided, first asset in < 3 min (PRD `ON-3`), writing through `MarkdownStore` | _ | B | P0 |
| [ ] | NW-6 | **Manual liability entry** — EMIs, cards, loans (PRD `NW-3`) | _ | B | P0 |
| [ ] | NW-7 | **Net-worth dashboard** — total, allocation chart, liabilities, last-updated. This is the exit criterion | _ | B | P0 |
| [ ] | NW-8 | Monthly `snapshots` write (aggregates only) + MoM delta | _ | A | P1 |
| [ ] | NW-9 | Empty / loading / error states and a **WCAG 2.1 AA** pass on the new surface | Beny | B | P1 |
| [ ] | NW-10 | **Playwright** e2e: sign in → add asset → see net worth (TECHSTACK §10 puts Playwright from this phase; it is also how async Server Components get covered) | _ | A | P1 |

---

## 8. Broker CSV import (`CSV-*`)

PRD `ON-4`. Parsing is pure and **client-side** — the file never leaves the device.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | CSV-1 | Import pipeline in `packages/core`: parse → normalise → map to `finlio/v1` assets. Pure, fixture-tested | _ | A | P0 |
| [ ] | CSV-2 | **Zerodha** holdings CSV parser + fixtures (incl. a malformed file) | _ | A | P0 |
| [ ] | CSV-3 | **Groww** holdings CSV parser + fixtures | _ | A | P0 |
| [ ] | CSV-4 | Import UI — file picker, parsed preview, **dedupe/merge** against existing holdings, explicit confirm before writing | _ | B | P0 |
| [ ] | CSV-5 | Assert in tests that import performs **no network call** — the CSV is parsed in the browser and never uploaded | _ | A | P0 |
| [ ] | CSV-6 | Angel One / ICICI Direct / Kite parsers | _ | A | P1 |

---

## 9. Goals — static (`GOAL-*`)

PRD §6.5 `GO-1`/`GO-2`. **Static this phase** — the planner computes, nothing
coaches or alerts. The Goal Coach agent is Phase 3.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | GOAL-1 | **Goal planner in `packages/core`** — monthly saving needed, **6% INR inflation default**, Vitest including the "impossible in this timeframe" case | _ | A | P0 |
| [ ] | GOAL-2 | tRPC goals CRUD over the service layer; **≤ 3 goals on Free** enforced server-side | _ | A | P0 |
| [ ] | GOAL-3 | Goals UI — create / edit / list with progress | _ | B | P0 |
| [ ] | GOAL-4 | Progress derived from current net worth (read-only; no nudges, no milestone alerts) | _ | A | P0 |
| [ ] | GOAL-5 | Link assets / SIPs to a goal (PRD `GO-3`, Pro) | _ | B | P1 |

---

## 10. Payments scaffolding (`PAY-*`)

**Scaffolding only — Phase 2 does not charge anyone.** The point is that
entitlements are server-side from day one (architecture §4.6), so mobile IAP rules
never force a billing rewrite.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | PAY-1 | DodoPayments account + products in **test mode**; confirm the INR recurring model and GST/entity setup (PRD §14 open question) | _ | A | P0 |
| [ ] | PAY-2 | `POST /api/webhooks/dodo` REST route handler — **signature-verified**, idempotent, writes `subscriptions`. REST because the caller is external (ADR-0002) | _ | A | P0 |
| [ ] | PAY-3 | **Entitlement service in `packages/core`** — `getEntitlement(userId)` → tier, read from the account. Clients never derive tier from a local purchase record | _ | A | P0 |
| [ ] | PAY-4 | Wire the Free-tier gates (e.g. `GOAL-2`'s 3-goal cap) to entitlements | _ | A | P1 |
| [ ] | PAY-5 | Pricing page + checkout link, **disabled / test mode only** | _ | B | P1 |

---

## 11. Observability (`OBS-*`)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | OBS-1 | **Sentry** on web (client + server + edge), source maps, release tagging | _ | A | P0 |
| [ ] | OBS-2 | **Scrubbing** — a tested rule that raw Markdown, holdings, and ₹ amounts never reach Sentry or PostHog. A finance app leaking balances into an error tracker is the worst-case bug | _ | A | P0 |
| [ ] | OBS-3 | PostHog product funnel for the signed-in surface: `signup_completed` → `asset_added` → `networth_viewed` (consent-gated, as Phase 1 established) | _ | A | P0 |
| [ ] | OBS-4 | Add the new keys to `.env.example` — `SENTRY_DSN`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DODO_*`, Upstash (closes Phase-1 `REPO-3`) | _ | A | P0 |
| [ ] | OBS-5 | Uptime/health check on the app + a note on the 99.5% target (PRD §6.9) | _ | A | P1 |

---

## 12. AI Core groundwork — no UI (`AI-*`)

Runs **in parallel** with everything above: none of it needs auth, the dashboard, or
a schedule. **Explicitly out of scope here: QStash, scheduled jobs, and morning-brief
delivery — those are Phase 3.** What Phase 2 builds is the machinery those jobs will
call.

> When touching model code, consult the `claude-api` reference for current model IDs
> and pricing rather than memory (TECHSTACK §7).

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | AI-1 | **LLM adapter interface** in `packages/core` — provider-agnostic `generate({ task, input, schema })`; Claude (reasoning) + Gemini Flash (fast) implementations behind it | Gokul | A | P0 |
| [ ] | AI-2 | Task → model **routing table** + failover, so a provider change is config, not a refactor | Gokul | A | P0 |
| [ ] | AI-3 | **Prompt skeletons as pure builders** (PRD Appendix B shape): morning brief, goal coach, expense analyser, monthly report. Pure functions of typed input — testable with zero network | Gokul | A | P0 |
| [ ] | AI-4 | **Guardrails module** — disclaimer appended to every output, suggest-never-execute assertions, no system-prompt leakage, prompt-injection hardening for any fetched web/news text | Gokul | A | P0 |
| [ ] | AI-5 | **Output validation** — every LLM response parsed against `SCHEMA-6` before it can be used or rendered; typed failure path, never a raw string to the UI | Gokul | A | P0 |
| [ ] | AI-6 | **Eval-suite stub** — golden fixtures + Vitest harness asserting output structure, **no fabricated numbers**, and disclaimer present. Runs offline against a recorded/mock provider so CI never calls an LLM | Gokul | A | P0 |
| [ ] | AI-7 | Token/cost accounting helper + per-user caps (Upstash Redis) | _ | A | P1 |
| [ ] | AI-8 | pgvector retrieval helper stub for news/holdings relevance (Phase 3 fills it) | _ | A | P1 |

---

## 13. Phase-2 exit checklist

- [ ] A **signed-in** user can enter assets + liabilities **on-device** and see their
      **real net worth** on web
- [ ] Supabase Auth live — email OTP + Google (Apple tracked in `AUTH-9`) — through an
      **injectable storage adapter** in `packages/data`
- [ ] `profiles`, `subscriptions`, `goals`, `snapshots`, `brief_logs` exist via Drizzle
      migrations with **RLS + owner-only policies on every table**; migrations apply in
      CI against the preview DB
- [ ] App data flows over **tRPC** (`packages/api`); business logic lives in
      `packages/core`; Server Actions are still thin wrappers; webhooks are REST
- [ ] `MarkdownStore` is an interface with a **passing conformance suite**; the web
      adapter (OPFS/IndexedDB + WebCrypto) implements it; the key lifecycle is documented
- [ ] Net-worth engine, goal planner, `finlio/v1` parser, and CSV parsers are pure
      `packages/core` code with **Vitest** coverage
- [ ] Shared Zod schemas in `packages/schemas`, **including the agreed agent-output
      schema** (`SCHEMA-6`)
- [ ] Zerodha + Groww CSV import works client-side, with dedupe and confirm
- [ ] Static goals: create, plan (6% inflation), see progress
- [ ] **Sentry** live with financial values scrubbed; PostHog signed-in funnel firing
- [ ] DodoPayments **scaffolding** only — webhook + `subscriptions` + entitlement
      service; **nobody is charged**
- [ ] AI groundwork landed **without UI**: LLM adapter, prompt builders, guardrails,
      schema-validated outputs, eval-suite stub — all offline in CI
- [ ] ADR-0004 (what leaves the device) and ADR-0005 (web on-device storage) written
- [ ] CI green (`Lint · Typecheck · Test · Build`); branch protection unchanged; docs
      updated with what shipped

---

## 14. Explicitly **not** this phase

Kept here so nobody pulls them forward:

- **Phase 3 — AI Core:** QStash scheduling, the job route handlers, the delivered
  **market-morning brief**, Expense Analyser, Goal Coach, Reminder & Action,
  Financial Health Score, the monthly report + PDF, live market data and news.
  Phase 2 builds the adapter, prompts, guardrails, schema, and evals — it does not
  send anything to anyone.
- **Phase 4 — Growth & Mobile:** `apps/mobile` (Expo/RN), the native MarkdownStore
  adapter, push notifications, biometric lock, **live billing** and tier
  enforcement at the paywall, App Store IAP handling, **Account Aggregator**
  integration, multi-currency NRI mode + live FX.
- **Phase 5 — Depth:** family profiles, goal stress-test simulator, tax module,
  WhatsApp alerts, home-screen widgets, regional-language UI, the CA/advisor portal.
- **Also deferred:** opt-in end-to-end-encrypted cloud backup of the Markdown store,
  expense/income logging and AI categorisation (they arrive with the Expense
  Analyser in Phase 3), and US-stock / crypto asset classes.
