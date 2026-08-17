# Finlio — Architecture & System Design

The shared reference for **how Finlio is structured** so that web today and mobile
later are the *same system*, not two codebases. Anyone — teammate or AI agent —
should read this before designing a feature, so we don't build something in a way
that has to be redone when the mobile app arrives.

- **What** we build: [`PRD.md`](./PRD.md)
- **How** (stack): [`TECHSTACK.md`](./TECHSTACK.md)
- **When**: [`dev-plan.md`](./dev-plan.md)
- **Decisions**: [`adr/`](./adr) (Architecture Decision Records)

---

## 1. Principles

1. **India-first, global later.** Build for Indian investors + NRIs first; global is
   a scale goal.
2. **Web/desktop first, mobile next.** Web ships first; native **iOS + Android**
   (React Native / Expo) follow at scale.
3. **One system, two clients.** Web and mobile are thin clients over the same
   API and the same domain logic. Share **logic and values, never views.**
4. **Privacy by design.** Raw financial data lives on-device (encrypted Markdown);
   cloud is opt-in and end-to-end encrypted.
5. **Suggest, never execute.** Agents advise; they never trade or move money.
   Every AI output carries a "not investment advice" disclaimer.

---

## 2. Monorepo (Turborepo + pnpm)

Decision: **[ADR-0001](./adr/0001-monorepo-turborepo-pnpm.md)**. We use a single
repo with **Turborepo** task orchestration and **pnpm** workspaces. Structure:

```
finlio/
├─ apps/
│  ├─ web/            Next.js 16.3 app (the current app moves here; Vercel root dir)
│  └─ mobile/         Expo / React Native (added in the mobile phase)
├─ packages/
│  ├─ core/           Pure domain logic + service layer. Zero platform/framework deps.
│  ├─ schemas/        Zod schemas + shared TS types (one source of truth)
│  ├─ api/            tRPC router + typed client (the app-data API contract)
│  ├─ data/           Drizzle schema + Supabase access + MarkdownStore interface (adapters per platform)
│  ├─ tokens/         Design tokens (colour/space/type) → Tailwind preset + RN theme
│  └─ config/         Shared eslint / tsconfig / tailwind preset
├─ turbo.json
├─ package.json       pnpm workspaces
├─ lefthook.yml, commitlint.config.mjs   (root — unchanged)
└─ docs/
```

**Rule of thumb:** extract code into a package **when a second consumer needs it**,
not speculatively. Seed `core`/`schemas`/`tokens` empty and fill them as Phase-1
features land. UI components are **not** shared (web = DOM/Tailwind, mobile = RN).

---

## 3. The reuse boundary — what's shared vs per-platform

This table is the whole game. Get it right and mobile is additive, not a rewrite.

| Shared — write once in `packages/*` | Per-platform — implement twice |
|---|---|
| Domain/finance logic (net worth, XIRR, goal planner, inflation) | UI components (web DOM+Tailwind vs RN) |
| Agent logic + prompt building | Navigation (App Router vs Expo Router) |
| Zod schemas + TS types | On-device storage + crypto **adapters** |
| API contract + typed client (tRPC) | Push notifications, biometrics, widgets |
| DB queries (Drizzle) + Supabase access (injected adapter) | Platform chrome (status bar, safe areas) |
| Design **token values** | Design **component implementations** |

---

## 4. Layered architecture

```
        ┌─────────────────────────┐        ┌──────────────────────────┐
        │  apps/web (Next.js)      │        │  apps/mobile (Expo/RN)   │
        │  App Router · Tailwind   │        │  Expo Router · RN views  │
        └───────────┬─────────────┘        └────────────┬─────────────┘
                    │  same typed client (packages/api)   │
                    │  same domain logic (packages/core)  │
                    └──────────────────┬──────────────────┘
                                       │  HTTPS / TLS 1.3
              ┌────────────────────────▼─────────────────────────┐
              │           API surface (apps/web/app/api)          │
              │  • tRPC router      → app data (auth'd, typed)    │
              │  • REST route handlers → webhooks & integrations  │
              │    (Resend, QStash, DodoPayments, Account Aggr.)  │
              │  Both call the SAME service layer ↓               │
              └────────────────────────┬─────────────────────────┘
                                       │
              ┌────────────────────────▼─────────────────────────┐
              │        packages/core  (service + domain)          │
              │  Framework-agnostic. No next/* imports.           │
              └───┬───────────────┬───────────────┬──────────────┘
                  │               │               │
           ┌──────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐
           │  Supabase  │  │ Upstash     │  │ DodoPayments│
           │ PG/Auth/RLS│  │ Redis+QStash│  │ (webhooks)  │
           └────────────┘  └─────────────┘  └────────────┘

   On-device MarkdownStore (client-side, encrypted)  ⇄  opt-in E2E-encrypted backup
   Analytics: PostHog (web + mobile) · Errors: Sentry
```

### 4.1 API boundary — the #1 "don't redo" decision
Decision: **[ADR-0002](./adr/0002-api-boundary.md)**.

- **Server Actions are web-only.** React Native **cannot** call them. So business
  logic must **not** live in Server Actions.
- Real logic lives in a **service layer in `packages/core`**.
- App data is exposed via **tRPC** (`packages/api`) — typed end-to-end, one router
  consumed by both the web and RN clients.
- **Webhooks and third-party integrations are REST route handlers** (Resend inbound,
  QStash job callbacks, DodoPayments, Account Aggregator) — they must be REST.
- **Server Actions stay as thin wrappers** over the service layer, used only for
  progressive-enhancement forms (e.g. the current waitlist). They never hold logic
  the mobile app would also need.

### 4.2 Domain / core logic
`packages/core` holds net-worth aggregation, XIRR/CAGR, the goal planner (6% INR
inflation default), expense categorisation, financial-health scoring, and agent
prompt construction. Pure TypeScript, unit-tested (Vitest), reused verbatim by
mobile.

### 4.3 Data & auth
- **Supabase** Postgres with **RLS on every table** (a user reads only their own
  rows). Auth = email OTP + Google + Apple, issuing JWTs.
- The Supabase client lives in `packages/data` and takes an **injected storage
  adapter** — web uses cookies/localStorage, mobile uses Expo SecureStore. Same
  queries, different token storage.

### 4.4 On-device Markdown store (the privacy core)
- `MarkdownStore` **interface** in `packages/data`: `read/write/parse/serialize`.
- Parsing + the `finlio/v1` schema are **shared**; only the storage + crypto
  **adapter** differs:
  - **web** → OPFS/IndexedDB + WebCrypto (AES-GCM), key derived client-side.
  - **mobile** → Expo FileSystem + SecureStore-held key.
- Cloud backup is opt-in and **encrypted client-side** before upload (server can't
  read it). Nail this interface before writing either adapter.

### 4.5 Background work & AI agents
No always-on worker. **Upstash QStash** schedules HTTP callbacks to REST route
handlers (morning brief, expense analyser, goal coach, monthly report, reminders).
Each job endpoint verifies the QStash signature, is idempotent (Redis key), and
fans out per-user work. All agent logic is in `packages/core`; the LLM adapter
(Claude for reasoning, Gemini for speed) sits behind an interface. Guardrails:
suggest-never-execute, disclaimer appended, outputs schema-validated.

### 4.6 Payments & entitlements — mind app-store IAP
- Subscription state is derived from **DodoPayments webhooks → Supabase**. Clients
  **read entitlement from the account**, never from a local purchase record.
- **Apple/Google require IAP for in-app digital purchases (15–30% cut).** Plan:
  sell/upgrade on the **web**, mobile unlocks via the signed-in account. Deciding
  this now keeps the billing model from being rebuilt for mobile.

### 4.7 Design tokens
`packages/tokens` is the single source of truth for colour/space/type. It feeds a
**Tailwind preset** (web) and a **React Native theme** object (mobile), so the brand
stays identical without a shared component library.

---

## 5. The "don't redo for mobile" checklist

Decide/enforce these while building the web app:

- [ ] Business logic lives in `packages/core`, not in Server Actions or components.
- [ ] App data flows through **tRPC** (`packages/api`); webhooks/integrations are REST.
- [ ] Server Actions are thin wrappers only.
- [ ] Auth is Supabase JWT with an **injectable storage adapter**.
- [ ] `MarkdownStore` is an interface; web/native adapters implement it.
- [ ] Design tokens are values in `packages/tokens`, consumed by Tailwind + RN.
- [ ] Zod schemas in `packages/schemas` are the one source of truth for shapes.
- [ ] Entitlements are server-side (Dodo → Supabase); mobile reads, never writes.

---

## 6. Cross-cutting

- **Analytics:** PostHog on web + mobile (same event names via a shared wrapper).
- **Errors:** Sentry on web + mobile.
- **Security:** RLS everywhere; verify all webhook signatures; AES-256 on-device;
  no secrets in the repo (public repo — secret scanning + push protection on).
- **Testing:** Vitest for `packages/core` + schemas (highest-value coverage), plus
  component/integration tests; Playwright (web e2e) and Maestro (mobile e2e) later.
- **CI/CD:** Turborepo runs lint/typecheck/test/build across the graph with remote
  caching; Vercel deploys `apps/web`; EAS builds `apps/mobile`. Branch protection +
  Conventional Commits stay as they are (see [`CLAUDE.md`](../CLAUDE.md)).

---

## 7. Open questions

- Account Aggregator TSP partner (Setu / Finvu / …).
- Market-data + news provider(s) and licensing.
- Exact `finlio/v1` Markdown schema evolution/versioning strategy.
- Whether the web MarkdownStore is truly on-device (OPFS) or a hybrid with
  encrypted server backup by default.

---

*Companion decisions live in [`adr/`](./adr). When a choice here changes, add or
update an ADR and link it.*
