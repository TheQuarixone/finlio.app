# Phase 1 — Foundation & Infrastructure

Detailed, checkbox-tracked task board for Phase 1. Both devs work in **this same
doc**: claim a task by putting your handle in **Owner**, and tick the box when the
PR merges (link it). See [`dev-plan.md`](./dev-plan.md) for the phase overview and
[`TECHSTACK.md`](./TECHSTACK.md) for the stack.

**Goal:** turn the Finlio waitlist landing page into a real product foundation.
**Exit criteria:**
- A signed-in user can add assets + liabilities (stored on-device as Markdown) and
  see their **real net worth** on web.
- Up to 3 static goals can be created with a monthly-saving estimate.
- Zerodha & Groww CSV import populates holdings.
- CI (lint · typecheck · test · build · preview) gates every PR; branch protection on.
- PostHog + Sentry live; DodoPayments scaffolded (not yet charging).

**How to read the tables**
- **Owner:** `_` = unclaimed. Put your handle in.
- **Track:** A = Platform/Infra/Backend · B = Product/Frontend/Mobile.
- **Pri:** P0 = required to exit Phase 1 · P1 = nice-to-have this phase.
- Tick `[x]` and link the PR when done.

---

## 0. Repo & housekeeping

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | REPO-1 | Confirm default branch = `main` (single trunk; old `production`/`docs`/`email-templates` deleted) | _ | A | P0 |
| [ ] | REPO-2 | Rename local working folder `finchai` → `finlio` (repo is `Finlio.app`); update any local scripts/paths | _ | A | P0 |
| [ ] | REPO-3 | Add `.env.example` listing every key from TECHSTACK §9 (no values) | _ | A | P0 |
| [ ] | REPO-4 | Add `CONTRIBUTING.md` (branch flow, DoD, how to tick phase docs) | _ | A | P1 |
| [ ] | REPO-5 | Update root `README.md`: point to `docs/`, remove stale waitlist-only notes | _ | B | P1 |
| [ ] | REPO-6 | **Monorepo migration** — move app to `apps/web`, add Turborepo + pnpm workspaces, `packages/config` + seed `core`/`schemas`/`tokens`; set Vercel root dir; keep CI job name. See [ADR-0001](./adr/0001-monorepo-turborepo-pnpm.md). Do **after** current frontend WIP is committed. | _ | A | P0 |

---

## 1. Testing infrastructure (Vitest)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | TEST-1 | Install & configure **Vitest** (`vitest.config.ts`, jsdom env for components) | _ | A | P0 |
| [ ] | TEST-2 | Add scripts: `test`, `test:watch`, `test:coverage`, `typecheck` (see TECHSTACK §10) | _ | A | P0 |
| [ ] | TEST-3 | Add **Testing Library** (React) + example component test | _ | B | P0 |
| [ ] | TEST-4 | First unit tests for finance math (net worth sum, goal planner) | _ | A | P0 |
| [ ] | TEST-5 | Coverage reporting (v8) wired; target ≥ 70% on `src/lib` finance logic | _ | A | P1 |
| [ ] | TEST-6 | Test conventions doc/section: colocated `*.test.ts`, no live network, mock Resend/Supabase | _ | A | P1 |

---

## 2. CI/CD & dependency hygiene

> The workflow and Dependabot config are already committed at
> [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and
> [`.github/dependabot.yml`](../.github/dependabot.yml). These tasks verify/tighten
> them as scripts land.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | CI-1 | Verify CI runs lint · typecheck · test · build on PR (green) | _ | A | P0 |
| [ ] | CI-2 | Tighten CI: drop `--if-present` once `typecheck`/`test` scripts exist | _ | A | P0 |
| [ ] | CI-3 | Add coverage upload/summary to the CI run | _ | A | P1 |
| [ ] | CI-4 | Confirm **Dependabot** opens grouped weekly PRs (npm + actions) | _ | A | P0 |
| [ ] | CI-5 | **Branch protection** on `main`: require review + CI green, no direct push, linear history | _ | A | P0 |
| [ ] | CI-6 | Add PR template + (optional) `CODEOWNERS` | _ | A | P1 |
| [ ] | CI-7 | Confirm Vercel preview deploy posts a URL on each PR | _ | A | P0 |

---

## 3. Infrastructure & accounts

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | INFRA-1 | Create **Supabase** projects (prod + preview); store keys in Vercel/GitHub secrets | _ | A | P0 |
| [ ] | INFRA-2 | Create **Upstash Redis** + **QStash**; add tokens/signing keys | _ | A | P0 |
| [ ] | INFRA-3 | **PostHog** project; keys wired for web | _ | A | P0 |
| [ ] | INFRA-4 | **Sentry** projects (web now, RN later) | _ | A | P1 |
| [ ] | INFRA-5 | **Cloudflare**: DNS for `finlio.app`, Turnstile keys for public forms | _ | A | P1 |
| [ ] | INFRA-6 | **DodoPayments** account created; test keys stored (no charging yet) | _ | A | P1 |
| [ ] | INFRA-7 | Confirm Vercel prod project deploys from `main` + serves `finlio.app` | _ | A | P0 |

---

## 4. Auth & data model (Supabase)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | AUTH-1 | Supabase Auth: email OTP + Google + Apple | _ | A | P0 |
| [ ] | AUTH-2 | Auth UI: sign in / sign up / sign out; session in RSC + client | _ | B | P0 |
| [ ] | AUTH-3 | Protected app routes (`/app/*`) redirect unauthenticated users | _ | B | P0 |
| [ ] | DB-1 | Schema + migrations: `profiles`, `subscriptions`, `goals`, `snapshots`, `brief_logs` | _ | A | P0 |
| [ ] | DB-2 | **RLS policies** on every table (user reads only own rows) | _ | A | P0 |
| [ ] | DB-3 | Migrations applied in CI against preview DB | _ | A | P1 |
| [ ] | DB-4 | Onboarding capture: base currency, risk profile, income, avg expenses (ON-2) | _ | B | P0 |

---

## 5. On-device Markdown store

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | MD-1 | Define `MarkdownStore` interface (read/write/parse) + the finlio/v1 schema (PRD App. A) | _ | A | P0 |
| [ ] | MD-2 | **Web** impl: OPFS/IndexedDB + WebCrypto AES-GCM; key derived client-side | _ | A | P0 |
| [ ] | MD-3 | Markdown parse/serialise helpers (tables ↔ typed objects) with unit tests | _ | A | P0 |
| [ ] | MD-4 | One-click export (JSON + Markdown archive) | _ | B | P1 |
| [ ] | MD-5 | Opt-in E2E-encrypted cloud backup to R2/Supabase Storage (client-side encrypt) | _ | A | P1 |

---

## 6. App shell & design system

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | UI-1 | App shell/layout for `/app` (nav, header, responsive) | _ | B | P0 |
| [ ] | UI-2 | Consolidate design tokens (navy/green/gold vs landing palette — resolve PRD §14) | _ | B | P0 |
| [ ] | UI-3 | Set up Zustand + TanStack Query providers | _ | B | P0 |
| [ ] | UI-4 | Shared UI primitives (button, input, card, table) reusing `src/lib/ui.ts` | _ | B | P1 |
| [ ] | UI-5 | Charts baseline (Recharts) — allocation pie/treemap component | _ | B | P1 |

---

## 7. Core features (MVP surface)

| ✔ | ID | Task | Owner | Track | Pri | PRD ref |
|---|---|---|---|---|---|---|
| [ ] | FEAT-1 | Manual asset entry (equity, MF, cash, FD, real estate, insurance) | _ | B | P0 | ON-3, IN-* |
| [ ] | FEAT-2 | Manual liability entry (EMIs, cards, loans) | _ | B | P0 | NW-3 |
| [ ] | FEAT-3 | **Net-worth engine**: sum assets − liabilities in base currency (tested) | _ | A | P0 | NW-1 |
| [ ] | FEAT-4 | Dashboard: net-worth headline + asset allocation view | _ | B | P0 | NW-1/2 |
| [ ] | FEAT-5 | Zerodha + Groww **CSV import** with field mapping | _ | A | P0 | ON-4 |
| [ ] | FEAT-6 | Goals: create up to 3, static planner (monthly saving @ 6% inflation, tested) | _ | A | P0 | GO-1/2 |
| [ ] | FEAT-7 | Live prices for held equities (NSE/BSE) — cached in Redis | _ | A | P1 | IN-1 |
| [ ] | FEAT-8 | MF NAV lookup (AMFI) + basic XIRR (tested) | _ | A | P1 | IN-2, IN-10 |
| [ ] | FEAT-9 | Monthly net-worth snapshot write (feeds Phase 2 reports) | _ | A | P1 | NW-4 |

---

## 8. Analytics & payments scaffolding

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | ANA-1 | PostHog wired (web) + funnel events: waitlist → signup → first asset | _ | A | P0 |
| [ ] | ANA-2 | Feature flags set up (gate future tier features) | _ | A | P1 |
| [ ] | PAY-1 | DodoPayments SDK integrated; pricing/tier config modelled (no live charge) | _ | A | P1 |
| [ ] | PAY-2 | Webhook route with signature verification (mirrors Resend inbound pattern) | _ | A | P1 |
| [ ] | PAY-3 | `subscriptions` table sync from webhook (test mode) | _ | A | P1 |

---

## 9. Phase-1 exit checklist

- [ ] Sign in → onboard → add assets/liabilities → see real net worth (web)
- [ ] Data persists on-device as encrypted Markdown; export works
- [ ] Zerodha/Groww CSV import populates holdings
- [ ] Create up to 3 goals with monthly-saving estimate
- [ ] CI gates every PR (lint · typecheck · test · build · preview); branch protection on
- [ ] Dependabot opening weekly PRs, CI-gated
- [ ] PostHog funnel + Sentry live; DodoPayments scaffolded in test mode
- [ ] `docs/` (PRD, TECHSTACK, dev-plan, phase-1) current with what shipped

> When this checklist is green, create `phase-2.md` from the abstract in
> [`dev-plan.md`](./dev-plan.md) and start the AI Core.
