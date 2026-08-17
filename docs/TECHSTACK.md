# Finlio — Tech Stack & Architecture

Companion to [`PRD.md`](./PRD.md) (what) and [`dev-plan.md`](./dev-plan.md) (when).
This document is the source of truth for **how** Finlio is built and operated. For
the system design — the **monorepo layout** and the **web↔mobile reuse boundary** —
see [`architecture.md`](./architecture.md) and the decision records in
[`adr/`](./adr).

> **Repo shape:** Finlio is a **monorepo** (Turborepo + pnpm) — `apps/web`,
> `apps/mobile` (later), and shared `packages/*`. See
> [ADR-0001](./adr/0001-monorepo-turborepo-pnpm.md). Business logic lives in
> `packages/core` and is exposed via **tRPC** (app data) + **REST** route handlers
> (webhooks/integrations) — see [ADR-0002](./adr/0002-api-boundary.md) — so the
> mobile app reuses it wholesale.

---

## 1. At a glance

| Layer | Choice | Notes |
|---|---|---|
| **Web framework** | **Next.js 16.3** (App Router, RSC, Turbopack) | React 19 + React Compiler; already in repo |
| **Language** | TypeScript (strict) | shared types across web + mobile |
| **Styling** | Tailwind CSS v4 | design tokens in `globals.css` |
| **UI components (web)** | **shadcn + Base UI** | copy-in components on Base UI primitives; themed by our tokens |
| **Mobile** | **React Native (Expo)** | one codebase → iOS + Android |
| **Auth + DB** | **Supabase** (Postgres, Auth, Storage, RLS, pgvector) | JWT, row-level security |
| **ORM / migrations** | **Drizzle ORM** (+ drizzle-kit) | typed schema + SQL migrations over Supabase Postgres |
| **Edge / CDN / security** | **Cloudflare** | DNS, WAF, R2 (backups), Turnstile, Workers if needed |
| **Payments** | **DodoPayments** (Merchant of Record) | web first → mobile |
| **Analytics** | **PostHog** | product analytics, funnels, flags, session replay |
| **Cache / KV** | **Upstash Redis** | agent session context, rate limits, idempotency |
| **Scheduling / queues** | **Upstash QStash** | cron + delayed jobs that call our API routes |
| **Email** | **Resend** | waitlist, briefs, monthly reports, inbound relay |
| **Hosting** | **Vercel** (web) | preview deploys per PR |
| **AI / LLM** | Anthropic Claude + Google Gemini | reasoning vs. speed split (see §7) |
| **Testing** | **Vitest** (+ Testing Library, Playwright later) | unit/integration + e2e |
| **CI/CD** | **GitHub Actions** + **Dependabot** | lint · typecheck · test · build · preview |
| **Errors/monitoring** | Sentry (+ PostHog) | web + mobile |

**Design intent:** almost everything is **serverless and managed**. There is no
always-on backend to babysit — scheduled agents are QStash → Next.js API routes.
This keeps ops near-zero for a two-person team and costs scale with usage.

---

## 2. High-level architecture

```
                         ┌──────────────────────────────┐
                         │           Clients             │
                         │  Web (Next.js/Vercel)         │
                         │  Mobile (React Native/Expo)   │
                         └───────────────┬──────────────┘
                                         │  HTTPS / TLS 1.3
                         ┌───────────────▼──────────────┐
                         │   Next.js API routes / RSC    │  ← single API surface
                         │   (Server Actions + Route     │     (web + mobile call it)
                         │    Handlers on Vercel)        │
                         └──┬─────────┬─────────┬────────┘
        ┌───────────────────┘         │         └──────────────────┐
   ┌────▼─────┐              ┌─────────▼────────┐          ┌────────▼────────┐
   │ Supabase │              │  Upstash Redis   │          │  DodoPayments   │
   │ Postgres │              │  + QStash (cron) │          │  (subscriptions)│
   │ Auth/RLS │              └─────────┬────────┘          └─────────────────┘
   │ Storage  │                        │ scheduled triggers
   │ pgvector │              ┌─────────▼────────┐          ┌─────────────────┐
   └──────────┘              │   AI Agents      │──────────▶     Resend      │
        ▲                    │  (LLM reasoning) │  emails  │ briefs/reports  │
        │ encrypted backup   └─────────┬────────┘          └─────────────────┘
   ┌────┴─────┐                        │ market data / news / FX
   │Cloudflare│              ┌─────────▼────────┐
   │ R2 / WAF │              │ Market data · News · FX APIs │
   │ Turnstile│              └──────────────────┘
   └──────────┘
                    On-device Markdown store (client) ⇄ opt-in E2E-encrypted cloud backup
                    Analytics: PostHog (web + mobile)   ·  Errors: Sentry
```

**One API surface.** Both web and mobile talk to the same Next.js route
handlers / Server Actions. Mobile does not get its own backend; it authenticates
with Supabase and calls the same endpoints. This avoids drift and halves the
surface a two-person team maintains.

---

## 3. Frontend (web)

- **Next.js 16.3 App Router**, React Server Components, Server Actions for mutations
  (the waitlist already uses `joinWaitlist` in `src/app/actions.ts`).
- **React 19 + React Compiler** (`reactCompiler: true` in `next.config.ts`) — avoid
  manual `useMemo`/`useCallback`; let the compiler handle memoisation.
- **Tailwind v4** with tokens in `src/app/globals.css`. State: **Zustand** (local
  UI) + **TanStack Query** (server cache) once we move beyond the landing page.
- **UI components:** **shadcn** (copy-in, owned-in-repo components) built on
  **Base UI** primitives (unstyled, accessible), styled entirely through our
  design tokens. We own the component source, so it stays on-brand and easy to fork.
- **Forms:** React Hook Form + Zod (Zod also validates Server Action inputs and
  API bodies — one schema, shared).
- **Charts:** Recharts (start) with room for D3 for the treemap/allocation view.

**Design language across platforms — share tokens, not components.** Base UI is a
web/DOM library; its components **do not** run on React Native, so we deliberately
do **not** try to port them. What ports is the **design language**: colour, spacing,
type, radius, and motion tokens live in `packages/tokens` and feed both the web
Tailwind/shadcn theme and the RN theme. On mobile we build screens from **native
components** — SwiftUI on iOS and Jetpack Compose on Android (via `@expo/ui`), with
React Native fallbacks — themed with those shared tokens plus a light touch of our
design language, so each platform feels native yet unmistakably Finlio. This follows
the repo rule: **share logic and values, never views** (see
[`architecture.md`](./architecture.md)).

> ⚠️ **Next 16.3 is not the Next.js in your training data.** Before writing app code,
> read the relevant guide under `node_modules/next/dist/docs/` (per repo
> `AGENTS.md`). Do not run `next build` while `next dev` is running (see README).

---

## 4. Mobile (React Native + Expo)

- **Expo** managed workflow, TypeScript, **Expo Router** (file-based routing that
  mirrors the web App Router mental model).
- **Auth:** `@supabase/supabase-js` with secure token storage (Expo SecureStore).
- **Push:** Expo Notifications → APNs/FCM for agent alerts and briefs.
- **Security:** biometric app-lock (Expo LocalAuthentication).
- **Widgets:** home-screen net-worth widget (native module / Expo config plugin).
- **Builds/release:** EAS Build + EAS Submit to TestFlight and Play. OTA updates via
  EAS Update for JS-only fixes.
- **Shared code:** types, Zod schemas, and pure finance/calculation logic live in a
  shared package so web and mobile compute net worth/XIRR identically.

---

## 5. Backend & data

### 5.1 Supabase + Drizzle ORM
- **Postgres** for relational/account data (waitlist/newsletter subscribers now;
  users, subscriptions mirror, goals metadata, snapshots, brief-send logs later).
  **RLS on every table** — a user reads only their own rows.
- **Drizzle ORM** is our schema + query layer over Supabase Postgres. Schema is
  defined in TypeScript (`src/db/schema.ts` → later `packages/data`), migrations are
  generated and applied with **drizzle-kit**, and the typed client is shared across
  Server Actions and route handlers. Drizzle owns the schema; Supabase provides the
  managed Postgres, Auth, Storage, and RLS around it.
- **Auth** — email OTP + Google + Apple; issues JWTs consumed by web + mobile
  (Phase 2).
- **Storage** — encrypted backups, generated report PDFs.
- **pgvector** — embeddings for AI context retrieval (news/holdings relevance).
- Migrations are tracked in the repo (drizzle-kit output) and applied in CI against
  the preview DB.

**`subscribers` — the first table (Phase 1), named for scale.** The waitlist is not
its own table; it is a `subscribers` table shaped so it becomes the **newsletter
audience** later without a rename or migration churn: `id`, `email` (unique),
`status` (`waitlist` | `subscribed` | `unsubscribed`), `source`, `referrer`,
`created_at`, `updated_at`. The public form inserts a `waitlist` row (server-side,
service-role); when newsletters launch, the same rows transition to `subscribed`.

**Storage vs sending** ([ADR-0003](./adr/0003-subscriber-storage-and-sending.md)):
Supabase `subscribers` is the **source of truth**; **Resend** is the sending layer.
Transactional mail goes via `resend.emails.send`; the newsletter goes via **Resend
Audiences + Broadcasts**, which provide managed one-click unsubscribe
(`List-Unsubscribe` / RFC 8058) and suppression. Unsubscribes sync back into
`subscribers.status` via a `contact.updated` webhook. We do **not** hand-roll
unsubscribe/suppression. The current Resend-Contacts store in `src/lib/waitlist.ts`
is interim until this table lands.

**Local development** runs a full Supabase stack locally via the Supabase CLI
(`supabase start`) with Drizzle migrations applied against it — a one-command setup
documented in [`local-supabase.md`](./local-supabase.md).

### 5.2 Local Markdown store (the privacy core)
Raw financial data lives **on the client** as structured Markdown (schema in PRD
Appendix A), AES-256-encrypted.
- **Mobile:** encrypted file in app sandbox (Expo FileSystem + SecureStore key).
- **Web:** browser has no real filesystem — use **OPFS/IndexedDB** with WebCrypto
  (AES-GCM), key derived from the session and never sent to the server. *(This is an
  open design item — see PRD §14; the abstraction is a `MarkdownStore` interface
  with `web` and `native` implementations.)*
- **Cloud backup** is opt-in and **end-to-end encrypted** (client encrypts before
  upload to Cloudflare R2 / Supabase Storage; server can't read it).

### 5.3 Upstash Redis
Agent session/context memory, rate limiting (per-user brief/report caps),
idempotency keys for webhooks and scheduled jobs, and short-lived caches for
market data/FX.

---

## 6. Scheduling & background work (QStash)

No Celery, no always-on worker. **Upstash QStash** schedules and delivers HTTP
callbacks to our Next.js route handlers:

| Job | Schedule (IST) | Endpoint (example) |
|---|---|---|
| Market-morning brief | Weekdays 08:15 | `POST /api/jobs/morning-brief` |
| Expense analyser | Daily 02:00 | `POST /api/jobs/expense-analyse` |
| Goal coach | Sun 08:00 | `POST /api/jobs/goal-coach` |
| Monthly report | 1st 05:00 | `POST /api/jobs/monthly-report` |
| Reminders sweep | Daily 07:00 | `POST /api/jobs/reminders` |

Rules: every job endpoint **verifies the QStash signature**, is **idempotent**
(Redis idempotency key), and fans out per-user work with retries/backoff (QStash
native). Long user loops publish one QStash message per user (or per batch) rather
than iterating in a single request to stay within serverless time limits.

---

## 7. AI / LLM layer

- **Reasoning-heavy** (monthly report, goal coach, health coach): **Claude**
  (latest Sonnet-class model). **Fast/cheap** (categorisation, per-holding brief
  lines): **Gemini Flash**-class. Provider is behind an adapter so we can route per
  task and fail over.
- **Context** = on-device Markdown (sent as prompt context) + pgvector-retrieved
  news/holdings snippets. Low token cost is a design reason for Markdown.
- **Guardrails:** suggest-never-execute; disclaimer appended to every output;
  prompt-injection hardening on any web/news content pulled in; outputs schema-
  validated (Zod) before display.
- **Evals:** a golden-set eval suite (Vitest) runs agent prompts against fixed
  fixtures to catch regressions and hallucinated numbers before deploy.

> When touching any LLM/model code, consult the `claude-api` reference for current
> model IDs and pricing rather than relying on memory.

---

## 8. Third-party integrations

| Purpose | Provider(s) |
|---|---|
| Payments | **DodoPayments** |
| Email (transactional + inbound) | **Resend** (`hello@finlio.app` inbound already wired via webhook) |
| Broker connectivity | **Account Aggregator** (TSP TBD: Setu/Finvu) + CSV import (Zerodha/Groww/Angel One/ICICI Direct/Kite) |
| Market data | NSE/BSE realtime (provider TBD) + AMFI NAVs |
| FX rates | Open Exchange Rates (6h refresh) |
| Crypto | CoinGecko |
| News | NewsAPI + curated financial RSS |
| Analytics | **PostHog** |
| Errors | Sentry |
| CDN/WAF/bot | **Cloudflare** (+ Turnstile on public forms) |

---

## 9. Environments & configuration

| Env | Branch | Hosting | Data |
|---|---|---|---|
| **Production** | `main` (default) | Vercel prod + `finlio.app` | prod Supabase / Upstash / Dodo live |
| **Preview** | every PR | Vercel preview URL | preview/staging Supabase, Dodo test |
| **Local** | feature branches | `npm run dev` (:3000) | local env + test keys |

**Secrets** live in Vercel env vars (and GitHub Actions secrets for CI), never in
the repo. Known keys today: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`RESEND_WEBHOOK_SECRET`, `INBOUND_FORWARD_TO` (relay destination for inbound
mail; unset = no forwarding). Add per service:
`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`,
`DATABASE_URL` (pooled) / `DIRECT_URL` (direct, for drizzle-kit migrations),
`UPSTASH_REDIS_REST_URL` / `_TOKEN`, `QSTASH_TOKEN` / `QSTASH_CURRENT_SIGNING_KEY` /
`QSTASH_NEXT_SIGNING_KEY`, `DODO_API_KEY` / `DODO_WEBHOOK_SECRET`,
`POSTHOG_KEY` / `POSTHOG_HOST`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`,
`SENTRY_DSN`. Maintain a committed `.env.example` (no values).

Branch note: the repo runs a **single trunk, `main`** (the default branch). The
earlier `production`, `docs`, and `email-templates` branches were consolidated into
`main` and deleted. Dependabot's `dependabot/*` PR branches are automated/expected.

---

## 10. Testing strategy

| Level | Tool | What |
|---|---|---|
| Unit | **Vitest** | finance math (net worth, XIRR, goal planner, inflation), pure utils, Zod schemas |
| Component | Vitest + Testing Library | React components, form states, error paths |
| Integration | Vitest | Server Actions & route handlers with mocked Supabase/Resend/QStash |
| AI evals | Vitest (golden fixtures) | agent prompts → assert structure + no fabricated numbers |
| E2E | Playwright (from Phase 2) | signup → add asset → see net worth; waitlist happy path |
| Mobile | Vitest + RN Testing Library; Maestro for e2e (later) | shared logic + screens |

Conventions: colocate `*.test.ts(x)` next to source; deterministic tests (no live
network — mock market/FX/LLM); coverage reported in CI (target ≥ 70% on `src/lib`
finance logic, not a blunt global %). Root scripts to add in Phase 1:

```jsonc
// package.json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

---

## 11. CI/CD

Modeled on lean, high-signal indie CI (fast, everything-on-PR, auto dependency
updates, preview deploys). GitHub Actions + Dependabot.

**On every PR and push to `main`:**
1. **Lint** — `eslint`
2. **Typecheck** — `tsc --noEmit`
3. **Test** — `vitest run` (with coverage)
4. **Build** — `next build`
5. **Preview deploy** — Vercel (automatic via Git integration) posts a preview URL

Jobs run in parallel where possible; the workflow is committed at
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It uses `--if-present`
so it stays green before every script exists, then tightens as Phase 1 lands them.

**Dependency hygiene** — [`.github/dependabot.yml`](../.github/dependabot.yml)
opens weekly PRs for npm and GitHub Actions (grouped minor/patch). CI gates every
Dependabot PR; low-risk groups can auto-merge once green.

**Branch protection (to enable on `main`):** require PR review, require CI
green, no direct pushes, linear history. See
[`phase-1.md`](./phase-1.md) task CI-5.

**Mobile CI (from Phase 4):** EAS Build on tag/release; typecheck + Vitest on PR.

---

## 12. Observability & ops

- **PostHog** — funnels (waitlist → signup → first asset → paid), feature flags
  (gate agents/tiers), session replay on web, product events from web + mobile.
- **Sentry** — exceptions and performance on web + RN.
- **Health** — job success/failure logged to Postgres + alerted; QStash retries
  visible in its dashboard; Resend delivery/bounce webhooks tracked.
- **Cost guardrails** — per-user LLM token caps in Redis; brief/report rate limits.

---

## 13. Security checklist (living)

- [ ] RLS on every Supabase table; service-role key server-only
- [ ] Verify webhook signatures (Resend ✅ already, QStash, DodoPayments)
- [ ] Turnstile on public forms (waitlist, signup) to curb bots
- [ ] AES-256 for on-device Markdown; keys never leave the client
- [ ] E2E-encrypted opt-in cloud backup
- [ ] No credential storage; broker links only via AA token or CSV
- [ ] Prompt-injection hardening on any external text fed to LLMs
- [ ] Secrets only in Vercel/GitHub secret stores; `.env.example` kept current
- [ ] Dependabot + CI gate on every dependency PR

---

## 14. Why these choices (rationale, briefly)

- **Serverless-managed everything** → a two-person team ships product, not infra.
- **One Next.js API for web + mobile** → no backend drift, half the surface.
- **QStash over Celery/cron-workers** → scheduled agents with retries and zero
  always-on compute.
- **On-device Markdown** → the privacy differentiator *and* cheap LLM context.
- **DodoPayments (MoR)** → handles India GST/tax and global cards without us
  becoming a payments/compliance company on day one.
- **Drizzle ORM** → TypeScript-first schema, SQL-shaped queries, and lightweight
  drizzle-kit migrations that fit a plain Supabase Postgres — typed end-to-end
  without the weight of a heavier ORM.
- **shadcn + Base UI** → we own the component source (copy-in, not a locked
  dependency), Base UI gives accessible unstyled primitives, and everything is
  themed by our tokens — the same tokens that theme native mobile, so the design
  language ports even though the components don't.
- **Vitest** → Vite-native speed, Jest-compatible API, first-class TS/ESM.
