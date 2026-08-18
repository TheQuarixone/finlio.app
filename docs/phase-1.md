# Phase 1 — Landing, Waitlist & Foundations

Detailed, checkbox-tracked task board for Phase 1. Both devs work in **this same
doc**: claim a task by putting your handle in **Owner**, and tick the box when the
PR merges (link it). See [`dev-plan.md`](./dev-plan.md) for the phase overview and
[`TECHSTACK.md`](./TECHSTACK.md) for the stack.

**Goal:** make the public surface solid and lay the engineering foundations —
**nothing fancy, no product app yet**. Harden the landing page + waitlist + email
infra, plug in **Supabase** (via **Drizzle ORM**) with a forward-named
`subscribers` table, wire **Vitest** + **PostHog** to the current surface,
finalise **design tokens + app shell** (shadcn + Base UI), and get **CI green**.

**Exit criteria:**
- A visitor can join the waitlist; the signup **persists to Supabase**
  (`subscribers`, via Drizzle) *and* still sends the Resend confirmation email.
- `subscribers` is named/shaped for scale (waitlist today → newsletters later);
  migrations tracked; RLS/insert policy set for the public form.
- **Local Supabase** runs from a documented one-command setup
  ([`local-supabase.md`](./local-supabase.md)).
- **Vitest** configured with an example + waitlist-action tests; **PostHog** wired
  with the waitlist funnel events.
- **Design tokens finalised**; app shell + shadcn/Base UI primitives in place.
- **CI green** (lint · typecheck · test · build); branch protection on; Dependabot
  PRs CI-gated.

**How to read the tables**
- **Owner:** `_` = unclaimed. Put your handle in.
- **Track:** A = Platform/Infra/Backend · B = Product/Frontend/Mobile.
- **Pri:** P0 = required to exit Phase 1 · P1 = nice-to-have this phase.
- Tick `[x]` and link the PR when done.

> **Ownership this phase:** Beny drives Phase 1 — standing up Supabase + Drizzle in
> local dev and pushing through to the waitlist persisting in **prod Supabase** —
> plus design/UI. Gokul builds most of Phase 2+ and can start AI Core groundwork in
> parallel (see [`dev-plan.md`](./dev-plan.md) → Team & working model).

---

## 0. Repo & housekeeping

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | REPO-1 | Confirm default branch = `main` (single trunk; old `production`/`docs`/`email-templates` deleted) | Beny | A | P0 |
| [ ] | REPO-2 | Rename local working folder `finchai` → `finlio` (repo is `Finlio.app`); update any local scripts/paths | _ | A | P1 |
| [x] | REPO-3 | Add `.env.example` listing every key from TECHSTACK §9 (no values). *Partial: current keys listed; PostHog / Sentry / QStash / Dodo / LLM keys still to add.* | Claude | A | P0 |
| [x] | REPO-4 | Add `CONTRIBUTING.md` (branch flow, DoD, how to tick phase docs) | Claude | A | P1 |
| [x] | REPO-5 | Update root `README.md`: point to `docs/`, describe current waitlist app | Claude | B | P1 |

> **Monorepo migration** (Turborepo + pnpm, `apps/web` + seed `packages/*`, see
> [ADR-0001](./adr/0001-monorepo-turborepo-pnpm.md)) is **done** — the repo is now
> a monorepo. Everything runs from the root via pnpm + Turbo (`pnpm dev` /
> `pnpm build` / `pnpm lint`).

---

## 1. Testing infrastructure (Vitest)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | TEST-1 | Install & configure **Vitest** (`vitest.config.ts`, jsdom env for components) | Beny | A | P0 |
| [x] | TEST-2 | Add scripts: `test`, `test:watch`, `test:coverage`, `typecheck` (see TECHSTACK §10) | Beny | A | P0 |
| [x] | TEST-3 | Add **Testing Library** (React) + example component test (existing landing components). | Claude | B | P0 |
| [x] | TEST-4 | Unit/integration test for the **waitlist action** (`joinWaitlist`) with Supabase + Resend mocked | Beny | A | P0 |
| [x] | TEST-5 | Coverage reporting (v8) wired into CI | Claude | A | P1 |
| [x] | TEST-6 | Test conventions section: colocated `*.test.ts`, no live network, mock Resend/Supabase | Claude | A | P1 |

---

## 2. CI/CD & dependency hygiene

> The workflow and Dependabot config are already committed at
> [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and
> [`.github/dependabot.yml`](../.github/dependabot.yml). These tasks verify/tighten
> them as scripts land.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | CI-1 | Verify CI runs lint · typecheck · test · build on PR (green) | Claude | A | P0 |
| [x] | CI-2 | Tighten CI: drop `--if-present` once `typecheck`/`test` scripts exist | Beny | A | P0 |
| [x] | CI-3 | Add coverage upload/summary to the CI run | Claude | A | P1 |
| [x] | CI-4 | Confirm **Dependabot** opens grouped weekly PRs (npm + actions) *Confirmed: grouped weekly PRs opened for npm + actions; all CI-gated.* | Claude | A | P0 |
| [x] | CI-5 | **Branch protection** on `main`: require review + CI green, no direct push, linear history | Claude | A | P0 |
| [x] | CI-6 | Add PR template + (optional) `CODEOWNERS` | Claude | A | P1 |
| [x] | CI-7 | Confirm Vercel preview deploy posts a URL on each PR | Claude | A | P0 |

---

## 3. Supabase + Drizzle (subscribers)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | DB-1 | Create **Supabase** projects (prod + preview); store keys in Vercel/GitHub secrets *Prod project live (ap-south-1), migrated and smoke-tested; preview project + Vercel env vars still to add.* | Claude | A | P0 |
| [x] | DB-2 | **Local Supabase**: CLI-based one-command dev DB; write [`local-supabase.md`](./local-supabase.md) | Beny | A | P0 |
| [x] | DB-3 | Wire **Drizzle ORM** (`drizzle.config.ts`, `drizzle-kit` migrations, typed client) | Beny | A | P0 |
| [x] | DB-4 | Define **`subscribers`** schema — forward-named for scale: `id`, `email` (unique), `status` (`waitlist`/`subscribed`/`unsubscribed`), `source`, `referrer`, `created_at`, `updated_at`. | Claude | A | P0 |
| [x] | DB-5 | Generate + apply first migration; migrations applied in CI against preview DB. *Applied locally; applying migrations in CI against a preview DB still to do.* | Claude | A | P0 |
| [x] | DB-6 | **RLS**: enabled on `subscribers` with **no public policies** — all writes are server-side, so `anon`/`authenticated` get no access at all (stricter than an insert-only policy; nothing can read the list via PostgREST) | Claude | A | P0 |

---

## 4. Waitlist + email infra

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | WL-1 | Persist waitlist signups to `subscribers` via Drizzle in `joinWaitlist` (dedupe on email) | Beny | A | P0 |
| [x] | WL-2 | Keep the Resend confirmation email; verify send path + error handling | Beny | A | P0 |
| [ ] | WL-3 | Verify the Resend **inbound relay** webhook (signature-verified) still works | _ | A | P1 |
| [ ] | WL-4 | **Turnstile** on the waitlist form to curb bot signups | _ | A | P1 |
| [x] | WL-5 | Graceful UX for duplicate/invalid email + success state | Claude | B | P1 |

---

## 5. Design tokens & app shell (shadcn + Base UI)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | UI-1 | **Finalise design tokens** — resolve navy/green/gold vs the current landing palette (PRD §9) into one token set in `globals.css` | _ | B | P0 |
| [ ] | UI-2 | Set up **shadcn + Base UI** (components.json, Base UI primitives, Tailwind v4 wiring) | _ | B | P0 |
| [ ] | UI-3 | Core UI primitives on shadcn/Base UI (button, input, card) reusing `src/lib/ui.ts` | _ | B | P0 |
| [ ] | UI-4 | Minimal **app shell** (header/nav/footer, responsive, light/dark) — chrome only, no product routes | _ | B | P0 |
| [x] | UI-5 | Document the **tokens-shared / native-components** rule for RN (see TECHSTACK §3) *Covered in TECHSTACK §3 (share tokens, not components).* | Claude | B | P1 |

---

## 6. Analytics (PostHog)

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | ANA-1 | PostHog wired (web) | _ | A | P0 |
| [ ] | ANA-2 | Waitlist funnel events: `page_view` → `waitlist_submitted` → `waitlist_confirmed` | _ | A | P0 |
| [ ] | ANA-3 | Feature flags set up (for gating future work) | _ | A | P1 |

---

## 7. Phase-1 exit checklist

- [x] Waitlist signup persists to Supabase `subscribers` (Drizzle) **and** sends the confirmation email
- [x] `subscribers` shaped for scale (status field), migrations tracked, RLS enabled
- [x] Local Supabase runs from `docs/local-supabase.md` (one command)
- [x] Vitest configured; example component test + waitlist-action test pass
- [ ] Design tokens finalised; shadcn/Base UI primitives + app shell in place
- [ ] PostHog waitlist funnel live
- [x] CI gates every PR (lint · typecheck · test · build); branch protection on
- [x] Dependabot opening weekly PRs, CI-gated
- [ ] `docs/` (PRD, TECHSTACK, dev-plan, phase-1, local-supabase) current with what shipped

> **Moved to Phase 2 (Product Foundation):** Supabase Auth, the product schema
> (`profiles`/`subscriptions`/`goals`/`snapshots`/`brief_logs`), the on-device
> Markdown store, manual asset/liability entry, the net-worth dashboard,
> Zerodha/Groww CSV import, goals, Sentry, DodoPayments scaffolding, and the
> monorepo migration. When this checklist is green, create `phase-2.md` from the
> abstract in [`dev-plan.md`](./dev-plan.md) and start Product Foundation.
