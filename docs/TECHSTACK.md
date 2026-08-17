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
| **Web framework** | **Next.js 16** (App Router, RSC, Turbopack) | React 19 + React Compiler; already in repo |
| **Language** | TypeScript (strict) | shared types across web + mobile |
| **Styling** | Tailwind CSS v4 | design tokens in `globals.css` |
| **Mobile** | **React Native (Expo)** | one codebase → iOS + Android |
| **Auth + DB** | **Supabase** (Postgres, Auth, Storage, RLS, pgvector) | JWT, row-level security |
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

- **Next.js 16 App Router**, React Server Components, Server Actions for mutations
  (the waitlist already uses `joinWaitlist` in `src/app/actions.ts`).
- **React 19 + React Compiler** (`reactCompiler: true` in `next.config.ts`) — avoid
  manual `useMemo`/`useCallback`; let the compiler handle memoisation.
- **Tailwind v4** with tokens in `src/app/globals.css`. State: **Zustand** (local
  UI) + **TanStack Query** (server cache) once we move beyond the landing page.
- **Forms:** React Hook Form + Zod (Zod also validates Server Action inputs and
  API bodies — one schema, shared).
- **Charts:** Recharts (start) with room for D3 for the treemap/allocation view.

> ⚠️ **Next 16 is not the Next.js in your training data.** Before writing app code,
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

### 5.1 Supabase
- **Postgres** for relational/account data (users, subscriptions mirror, goals
  metadata, snapshots, brief-send logs). **RLS on every table** — a user reads only
  their own rows.
- **Auth** — email OTP + Google + Apple; issues JWTs consumed by web + mobile.
- **Storage** — encrypted backups, generated report PDFs.
- **pgvector** — embeddings for AI context retrieval (news/holdings relevance).
- Migrations tracked in `supabase/migrations` and applied in CI.

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
`RESEND_WEBHOOK_SECRET`. Add per service:
`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`,
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
  "test:coverage": "vitest run --coverage"
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
[`phase-1.md`](./phase-1.md) task INFRA-CI.

**Mobile CI (from Phase 3):** EAS Build on tag/release; typecheck + Vitest on PR.

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
- **Vitest** → Vite-native speed, Jest-compatible API, first-class TS/ESM.
