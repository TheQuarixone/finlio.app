# Phase 2.1 — Foundations slice (packages → schemas → auth)

The first executable slice of [`phase-2.md`](./phase-2.md). Phase 2 is large; 2.1 is
the part that must land **before anything else can be built correctly**, plus the AI
lane that runs beside it.

**Everything here is seam work.** No dashboard, no net-worth engine, no CSV import —
those land in 2.2 once these seams exist. The test of 2.1 is not "what can the user
see" (nothing new) but "can the next four features be built without a rewrite".

> **Read first:** [`architecture.md`](./architecture.md) §3, §4.1, §4.4, §5 and
> [`adr/0002-api-boundary.md`](./adr/0002-api-boundary.md).
> **Track in:** [`phase-2.md`](./phase-2.md) — 2.1 covers `PKG-1`–`PKG-5`,
> `SCHEMA-1`–`SCHEMA-6`, `AUTH-1`–`AUTH-8`, `DB-7`, `AI-1`–`AI-3`.

---

## Goal

Stand up the four seams every later feature depends on:

1. **The package graph** — `config`, `data`, `api` created; `core` given a real
   internal structure; the dependency direction enforced by lint.
2. **The shape vocabulary** — `packages/schemas`: money, assets, liabilities, goals,
   the `finlio/v1` document, and the agent-output envelope.
3. **Auth** — Supabase JWT behind an **injectable storage adapter**, with the web
   (cookie) adapter as one implementation.
4. **The LLM seam** — a provider-agnostic client + prompt builders, no UI, no schedule.

## Exit criteria for 2.1

- [ ] `pnpm turbo run lint typecheck test build` green across **all** workspace packages
- [ ] A lint error is produced if `packages/core` imports `next/*`, `react`, or `@finlio/data`
- [ ] `packages/schemas` exports validated Money / Asset / Liability / Goal /
      `FinlioDocument` / `AgentOutput`, each with Vitest coverage
- [ ] A user can sign in with **email OTP** and **Google**, land on a protected
      `/app` route, and sign out; a `profiles` row is created on first sign-in
- [ ] The Supabase client takes a storage adapter as an argument — swapping the web
      cookie adapter for an in-memory one requires **no change to `packages/data`**
- [ ] `packages/core` can produce a **schema-validated** LLM response through the
      adapter, and every test in CI runs with **no network and no database**

---

## How to read the tables

**Owner:** `_` = unclaimed · **Track:** A = Platform/Infra/Backend, B = Product/Frontend ·
**Pri:** P0 = required to exit 2.1, P1 = nice-to-have. IDs match
[`phase-2.md`](./phase-2.md) — tick in **both** docs when a PR merges.

---

## 0. Decisions this slice makes

These are the calls 2.1 bakes in. Three of them are refinements of
[`architecture.md`](./architecture.md) rather than restatements of it, so they are
called out explicitly — **`D1` needs Gokul's sign-off before PR 1 merges.**

### D1. Ports live in `core`, adapters live in `data` *(refines architecture §4.4)*

`architecture.md` §4.4 puts the `MarkdownStore` **interface** in `packages/data`. If
`packages/core` services then call it, `core` depends on `data`, which depends on
Drizzle, `postgres`, and Supabase — and "`core` has zero platform deps" stops being
true, along with "tests pass on a clean checkout with no services running".

Inverting it fixes both:

```
packages/core/src/
  domain/      pure functions — net worth, XIRR, goal planner, money math, finlio/v1 parser
               ZERO imports outside this folder
  ports/       interfaces only — ProfileRepository, GoalRepository, SnapshotRepository,
               MarkdownStore, LlmClient, Clock
  services/    orchestration — takes ports via an injected context, returns domain results
```

`packages/data` **implements** the ports over Drizzle/Supabase. The arrow points
inward: `api → core → (ports)` and `data → (ports)`. `core` imports nothing.

Why it is worth the deviation: every service test becomes a fake object rather than a
mocked module, the mobile app in Phase 4 implements the same ports, and the purity
lint rule (`PKG-5`) becomes trivially enforceable instead of aspirational.

**Record as an amendment note in ADR-0002** when PR 1 lands.

### D2. Money is an integer in minor units — never a float

`{ minor: number, currency: "INR" }`, where `minor` is paise. Floats drift when
aggregating across 20+ asset classes, and XIRR (Phase 3) is sensitive at the
boundaries. Arithmetic helpers live in `core/domain/money.ts`; formatting is
`Intl.NumberFormat("en-IN")` at the view layer only.

Fractional quantities (mutual-fund units, SGB grams) use the same trick: **`unitsE6`,
an integer of units × 10⁶.** Covers every real broker precision without a decimal
library.

### D3. `proxy.ts`, not `middleware.ts`, and it is not the authorization layer

Verified against the Next 16.3 docs bundled in `node_modules/next/dist/docs`:

- Next 16 **renamed `middleware.ts` → `proxy.ts`** (root or `src/`, so
  `apps/web/src/proxy.ts`). Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- Proxy **defaults to the Node.js runtime** in v16, and setting `runtime` throws.
- The docs are explicit that proxy is for **optimistic cookie checks only** — it runs
  on every prefetch, so no DB calls, and it is *not* a session-management or
  authorization solution.

So auth is **two layers**: `proxy.ts` does the cheap cookie-presence redirect and
session refresh; a `requireUser()` helper in the Data Access Layer does the real
check in every RSC / route handler / tRPC procedure. Never trust the proxy alone.

### D4. The disclaimer is a schema literal, not a template string

In the agent-output envelope, `disclaimer` is `z.literal(...)`. A model that drops or
rewores it fails validation and the output is discarded. This turns a compliance
requirement (PRD §6.9, §7 guardrails) into something the type system enforces.

---

## 1. PR 1 — the package graph (`PKG-1`–`PKG-5`, `DB-7`)

Branch: `chore/workspace-packages`

### What lands

```
packages/
  config/          NEW  eslint + tsconfig + tailwind preset, shared
    eslint/base.mjs, eslint/next.mjs, eslint/library.mjs
    tsconfig/base.json, tsconfig/nextjs.json, tsconfig/library.json
  core/            RESTRUCTURED  domain/ ports/ services/ (see D1)
  data/            NEW  drizzle schema + client + port implementations
    src/schema/*.ts        moved from apps/web/src/db/schema.ts
    src/client.ts          postgres.js + drizzle instance
    src/repositories/*.ts  implements core/ports
    drizzle/               MOVED from apps/web/drizzle — do NOT regenerate
    drizzle.config.ts      MOVED from apps/web
  api/             NEW  tRPC router (skeleton only — procedures arrive in PR 3)
  schemas/         (filled in PR 2)
  tokens/          untouched this slice
```

### How

**Packages are source-only.** No build step — `exports` points at `src`, and
`apps/web` transpiles them:

```jsonc
// packages/core/package.json
{
  "name": "@finlio/core",
  "type": "module",
  "exports": {
    ".":          "./src/index.ts",
    "./domain":   "./src/domain/index.ts",
    "./ports":    "./src/ports/index.ts",
    "./services": "./src/services/index.ts"
  },
  "scripts": { "lint": "eslint", "typecheck": "tsc --noEmit", "test": "vitest run" }
}
```

```ts
// apps/web/next.config.ts
transpilePackages: ["@finlio/core", "@finlio/schemas", "@finlio/data", "@finlio/api"],
```

Subpath exports matter: they make an illegal import (`@finlio/core/services` from a
client component) visible in review, not buried behind a barrel file.

**The purity guard (`PKG-5`)** is `no-restricted-imports` in
`packages/config/eslint/library.mjs`, applied to `packages/core`:

```js
"no-restricted-imports": ["error", { patterns: [
  { group: ["next", "next/*"],        message: "core is framework-agnostic (ADR-0002)" },
  { group: ["react", "react-dom"],     message: "core is framework-agnostic (ADR-0002)" },
  { group: ["@finlio/data", "@finlio/api"], message: "core is the bottom layer — depend on ports, not adapters" },
  { group: ["drizzle-orm*", "postgres", "@supabase/*"], message: "adapters belong in @finlio/data" },
]}],
```

**The Drizzle move (`DB-7`)** — `git mv` the `drizzle/` folder with its `meta/`
journal. Regenerating produces a fresh baseline migration that will try to recreate
`subscribers` against a database that already has it. `drizzle.config.ts` moves too;
its `schema` path becomes `./src/schema/index.ts` and the root scripts become
`pnpm --filter @finlio/data db:generate`.

**Turbo (`PKG-4`)** — `typecheck` currently declares `dependsOn: ["build"]` to stop
`next typegen` racing `next build` over `.next`. That is correct for `apps/web` and a
no-op for packages (no `build` task), so it can stay as-is.

### Tests

- `packages/data` — one Drizzle schema snapshot test so an accidental column rename is
  visible in the diff.
- A CI assertion that `pnpm --filter @finlio/core test` passes with **no env vars set**.

### Done when

`pnpm turbo run lint typecheck test build` is green, and adding
`import { cookies } from "next/headers"` to any file in `packages/core` fails lint.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | PKG-1 | `packages/config` — eslint / tsconfig / tailwind preset; `apps/web` points at it | _ | A | P0 |
| [x] | PKG-2 | `packages/data` — created; Drizzle client + repositories | _ | A | P0 |
| [x] | PKG-3 | `packages/api` — tRPC skeleton | _ | A | P0 |
| [x] | PKG-4 | Turbo covers packages (`lint`/`typecheck`/`test`); Vitest in `core` + `schemas` | _ | A | P0 |
| [x] | PKG-5 | Purity lint rule on `packages/core` (D1) | _ | A | P0 |
| [x] | DB-7 | Move Drizzle schema **and migration history** into `packages/data` | _ | A | P0 |
| [x] | PKG-7 | Restructure `core` into `domain/` `ports/` `services/`; note the D1 amendment in ADR-0002 | _ | A | P0 |

---

## 2. PR 2 — the shape vocabulary (`SCHEMA-1`–`SCHEMA-6`)

Branch: `feat/schemas`

### What lands

`packages/schemas` on **Zod 4** (`zod@^4`), exporting every shape the API, the
Markdown store, the CSV importers, and the agents validate against.

```
packages/schemas/src/
  money.ts       CurrencyCode, Money
  asset.ts       Asset — discriminated union on `kind`
  liability.ts   Liability
  goal.ts        Goal
  document.ts    FinlioDocument — the finlio/v1 in-memory model
  agent.ts       AgentOutput — the Gokul↔Beny seam
  index.ts
```

### How

**Money (`SCHEMA-2`)** — `z.number().int()` rather than Zod 4's `z.int()`, so the
schemas stay readable to anyone with Zod 3 muscle memory:

```ts
export const CurrencyCode = z.enum(["INR", "USD", "SGD", "AED"]);
export const Money = z.object({
  /** Minor units — paise for INR. Integer: never a float (see phase-2.1 D2). */
  minor: z.number().int(),
  currency: CurrencyCode,
});
```

**Assets (`SCHEMA-3`)** — a discriminated union, so adding an asset class is additive
and `switch` exhaustiveness catches every site that must handle it:

```ts
const AssetBase = z.object({
  id: z.uuid(),
  label: z.string().min(1).max(80),
  /** What the user says it is worth. The manual ValuationProvider reads this;
      a live-price provider overrides it in Phase 3 without a schema change. */
  manualValue: Money.optional(),
  updatedAt: z.iso.datetime(),
});

export const Asset = z.discriminatedUnion("kind", [
  AssetBase.extend({ kind: z.literal("equity"),
    ticker: z.string(), exchange: z.enum(["NSE", "BSE"]),
    qty: z.number().int(), avgPrice: Money, sector: z.string().optional() }),
  AssetBase.extend({ kind: z.literal("mutual_fund"),
    isin: z.string(), fund: z.string(),
    unitsE6: z.number().int(),        // units × 1e6 — see D2
    purchaseNav: Money, folio: z.string().optional() }),
  AssetBase.extend({ kind: z.literal("fixed_deposit"),
    bank: z.string(), principal: Money, ratePctE4: z.number().int(),
    startDate: z.iso.date(), maturityDate: z.iso.date() }),
  // real_estate · cash · epf · ppf · nps · sgb · insurance — PRD §6.4
]);
```

**`FinlioDocument` (`SCHEMA-5`)** — the crucial framing: **Markdown is the
serialization format, not the model.** In memory the document is this typed object;
`core/domain/finlio-v1.ts` parses to it and serializes from it (that parser is PR 2.2
work — 2.1 only fixes the contract). PRD Appendix A is a *draft*; this schema is what
makes it real, and `schema: z.literal("finlio/v1")` is the version handle
`SCHEMA-7` will hang migrations off.

**`AgentOutput` (`SCHEMA-6`) — the seam to agree with Beny.** Strawman below; the
point is to give Beny something concrete to push back on, not to land it unilaterally:

```ts
export const AgentOutput = z.object({
  schema: z.literal("finlio.agent/v1"),
  kind: z.enum(["morning_brief", "monthly_report", "goal_coach",
                "expense_analysis", "health_score"]),
  generatedAt: z.iso.datetime(),
  model: z.object({ provider: z.string(), id: z.string(), promptVersion: z.string() }),
  headline: z.string().max(120),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().max(80),
    body: z.string().max(600),
    items: z.array(z.object({
      /** id of the holding/goal this line is about, so the UI can deep-link it */
      ref: z.string().optional(),
      text: z.string().max(200),
      amount: Money.optional(),
      direction: z.enum(["up", "down", "flat"]).optional(),
    })).default([]),
  })).max(8),
  disclaimer: z.literal("This is guidance, not investment advice."),  // see D4
});
```

Four properties that make this the right seam:

- **No free-form HTML or Markdown body** — the model emits data, the screen owns
  presentation. Beny can restyle a brief without an agent change.
- **Every ₹ figure is a `Money`**, so the model never formats currency and never
  invents "₹1.2L" — `Intl.NumberFormat` does it, consistently.
- **`ref` ties a line to a holding**, which is what makes the brief clickable later.
- **`disclaimer` is a literal** (D4) — a dropped disclaimer is a validation failure.

### Tests

Each schema gets accept/reject cases. The ones that earn their keep: a float `minor`
rejected, an unknown `kind` rejected, an `AgentOutput` with a reworded disclaimer
rejected, and a `FinlioDocument` fixture matching PRD Appendix A accepted.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | SCHEMA-1 | Stand up `packages/schemas` on Zod 4 + Vitest | _ | A | P0 |
| [x] | SCHEMA-2 | Money primitives (integer minor units, D2) | _ | A | P0 |
| [x] | SCHEMA-3 | Asset + liability discriminated unions (PRD §6.4) | _ | A | P0 |
| [x] | SCHEMA-4 | Goal schema | _ | A | P0 |
| [x] | SCHEMA-5 | `FinlioDocument` — the `finlio/v1` in-memory model | _ | A | P0 |
| [x] | SCHEMA-6 | **Agree + land `AgentOutput`** — needs Beny | Gokul + Beny | A | P0 |

---

## 3. PR 3 — auth (`AUTH-1`–`AUTH-8`)

Branch: `feat/auth`

Depends on PR 1 and PR 2. **This is the PR where the "don't redo for mobile" bet is
either won or lost**, so the adapter comes before the screens.

### How — the injectable storage adapter (`AUTH-2`)

Supabase's JS client already accepts a storage object; the work is refusing to
hard-code the web one into `packages/data`:

```ts
// packages/data/src/auth/client.ts — NO next/* imports
export interface SessionStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export function createFinlioAuthClient(cfg: SupabaseConfig, storage: SessionStorage) {
  return createClient(cfg.url, cfg.publishableKey, {
    auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}
```

- **Web adapter lives in `apps/web`**, because it needs `next/headers` — cookies via
  `@supabase/ssr`, `(await cookies())` (async since Next 15).
- **Mobile adapter (Phase 4)** is Expo SecureStore. Same client, same queries.
- **Test adapter** is a `Map`. This is the conformance check: if swapping in the
  in-memory adapter requires touching `packages/data`, the seam is wrong.

One Next-specific trap to design around: **a Server Component cannot set cookies.**
Session refresh therefore happens in `proxy.ts` and in route handlers, and RSCs only
read. Get this wrong and sessions silently fail to refresh after an hour.

### How — route protection (`AUTH-5`), two layers per D3

```ts
// apps/web/src/proxy.ts   (Next 16 — NOT middleware.ts)
export async function proxy(req: NextRequest) { /* cookie presence + refresh only */ }
export const config = { matcher: ["/app/:path*"] };
```

```ts
// apps/web/src/lib/dal.ts — the real check, called by every /app RSC and route handler
export const requireUser = cache(async () => {
  const { data, error } = await supabase().auth.getUser();  // getUser, not getSession
  if (error || !data.user) redirect("/sign-in");
  return data.user;
});
```

`getUser()` revalidates the JWT with Supabase; `getSession()` trusts an unverified
cookie. Use `getUser()` on the server, always. `React.cache` keeps it to one call per
request across the RSC tree.

### How — profile creation (`AUTH-7`)

In the OAuth/OTP **callback route handler** (REST — external redirect target), not a
Server Action: `ensureProfile({ userId, email })` in `core/services/profile.ts`,
idempotent upsert through `ProfileRepository`. A DB trigger was the alternative;
service-layer wins because mobile hits the same path and it is testable with a fake.

### Providers

Email OTP (`AUTH-3`) and Google (`AUTH-4`) are P0 and are Supabase dashboard config
plus redirect URLs. **Apple (`AUTH-9`) is P1** — blocked on Apple Developer Program
enrolment, and mandatory only when the iOS app ships in Phase 4. The adapter is the
part that must be right now; a provider is configuration.

### Tests (`AUTH-8`)

All offline: `SessionStorage` conformance suite (memory + cookie fake), `requireUser`
redirecting when unauthenticated, `ensureProfile` idempotency against a fake
repository, and a sign-in form component test through accessible roles.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [ ] | AUTH-1 | Supabase Auth enabled local + prod; redirect URLs, OTP templates, JWT lifetimes *Blocked: needs Supabase dashboard access — providers, redirect URLs, OTP templates.* | _ | A | P0 |
| [x] | AUTH-2 | `createFinlioAuthClient` + `SessionStorage` in `packages/data`; cookie adapter in `apps/web` | _ | A | P0 |
| [~] | AUTH-3 | Email OTP end-to-end *Code complete; unverified against a live Supabase project.* | _ | A | P0 |
| [~] | AUTH-4 | Google OAuth *Code complete; unverified against a live Supabase project.* | _ | A | P0 |
| [x] | AUTH-5 | `src/proxy.ts` optimistic redirect + `requireUser()` DAL (D3) | _ | A | P0 |
| [x] | AUTH-6 | Sign-in / verify / sign-out screens (Gokul builds, Beny polishes) | _ | B | P0 |
| [x] | AUTH-7 | `ensureProfile` on first sign-in, via the service layer | _ | A | P0 |
| [x] | AUTH-8 | Auth tests — storage conformance, DAL redirect, profile idempotency | _ | A | P0 |

---

## 4. Parallel lane — the LLM seam (`AI-1`–`AI-3`)

Branch: `feat/llm-adapter` — **independent of PRs 1–3 after PR 1 lands.** No auth, no
UI, no schedule. Start it the day PR 1 merges.

> **Not in this slice:** QStash, scheduled jobs, brief delivery (Phase 3), and
> `AI-4`–`AI-6` guardrails/evals (rest of Phase 2).

### `AI-1` — the port

```ts
// packages/core/src/ports/llm.ts
export type LlmResult<T> =
  | { ok: true; value: T; usage: { inputTokens: number; outputTokens: number } }
  | { ok: false; reason: "schema" | "refusal" | "transport"; raw?: unknown };

export interface LlmClient {
  complete<T>(req: {
    task: LlmTask;
    system: string;
    input: string;
    schema: StandardSchemaV1<T>;   // a Zod schema from @finlio/schemas
  }): Promise<LlmResult<T>>;
}
```

`complete` **never returns a raw string.** Structured output in, parsed object or a
typed failure out. The UI can only ever receive something that validated.

Adapters go in `packages/data` (they are I/O): `AnthropicLlmClient`,
`GeminiLlmClient`, and `RecordedLlmClient` — which replays JSON fixtures from disk so
CI never makes a network call and the `AI-6` eval suite has something to run against.

### `AI-2` — the routing table

Reasoning vs. fast is a table, not an `if`, so changing a model is one line:

| Task | Model | Why |
|---|---|---|
| `monthly_report`, `goal_coach`, `health_score` | `claude-opus-5` | Multi-step reasoning over the whole portfolio; correctness beats cost |
| `morning_brief` (per-holding lines) | **decision needed — see below** | Runs per user per weekday; the cost-sensitive path |
| `expense_categorise` | `claude-haiku-4-5` / Gemini Flash | High volume, low reasoning |

Anthropic-side specifics, from the current API reference (do **not** write these from
memory — model IDs and the thinking API both moved in 2025–26):

- SDK `@anthropic-ai/sdk` (latest `0.122.0`). Model IDs are complete as written —
  **never append a date suffix.**
- Structured output is `output_config: { format: … }`, or `client.messages.parse()`
  which validates for you. The old `output_format` parameter is deprecated.
- Thinking is `thinking: { type: "adaptive" }`. `budget_tokens` is **removed** on
  Opus 5 and returns a 400.
- Depth is `output_config: { effort: "low" | "medium" | "high" | "xhigh" | "max" }`.

TECHSTACK §7 still says "Claude (latest Sonnet-class model)" — that phrasing predates
the current lineup. Replace it with a pointer to this routing table (`OBS-6`, below).

### `AI-3` — prompt builders

Pure functions, no I/O, no SDK import:

```ts
export function buildGoalCoachPrompt(input: GoalCoachInput):
  { system: string; user: string; version: "goal-coach@1" }
```

`version` is stamped into `AgentOutput.model.promptVersion`, so an eval failure points
at an exact prompt revision. PRD Appendix B is the starting text; the 6% INR inflation
default and the ≤150-word cap are inputs to the builder, not prose baked into a string.

| ✔ | ID | Task | Owner | Track | Pri |
|---|---|---|---|---|---|
| [x] | AI-1 | `LlmClient` port + Anthropic / Gemini / Recorded adapters | Gokul | A | P0 |
| [x] | AI-2 | Task→model routing table + failover | Gokul | A | P0 |
| [x] | AI-3 | Prompt builders as pure, versioned functions | Gokul | A | P0 |
| [ ] | OBS-6 | Update TECHSTACK §7 to point at the routing table instead of naming a model tier | _ | A | P1 |

---

## 5. Not code — unblock these in week 1

| ✔ | ID | Item | Owner |
|---|---|---|---|
| [ ] | DB-1b | Preview Supabase project + keys in Vercel/GitHub secrets — blocks `DB-14` | Beny |
| [x] | SCHEMA-6 | Sit with Beny on the agent-output envelope; the strawman in §2 is the starting point | Gokul + Beny |
| [ ] | REPO-6 | ~~Stray root `package-lock.json`~~ **done** — removed and reinstalled with pnpm | — |

> Note from the reinstall: `package.json` pins `packageManager: pnpm@11.22.0` but the
> install ran on pnpm 9.15.9, so Corepack is not enforcing the pin locally. Worth a
> `corepack enable` on both machines before the lockfile drifts.

---

## 6. Open decisions for Gokul

1. **D1 (ports in `core`)** — accept the refinement to architecture §4.4, or keep the
   interface in `data` and let `core` depend on it? Everything in PR 1 hangs off this.
2. **Morning-brief model.** It runs per user, per weekday, and it is the wedge — the
   one output users judge the product on. `claude-opus-5` is the default and the
   quality-safe answer; a cheaper model on the per-holding lines is a real saving at
   scale. This is a product-cost call, not an engineering one. Deciding it late is
   fine; deciding it silently is not.
3. **`unitsE6` vs. decimal strings** for fractional units (D2). Scaled integers are
   simpler and dependency-free; decimal strings survive an unexpectedly precise broker
   CSV. Recommendation: `unitsE6`, revisit if a real CSV in `CSV-2`/`CSV-3` breaks it.

---

## 7. What 2.2 picks up

With 2.1 merged, these unblock and can run in parallel: `DB-8`–`DB-16` (product
tables + RLS), `API-1`–`API-4` (tRPC procedures over the service layer), `STORE-1`–
`STORE-6` (the Markdown store), then `NW-*`, `CSV-*`, `GOAL-*`. Full list in
[`phase-2.md`](./phase-2.md).
