@apps/web/AGENTS.md

# Finlio — working rules

Guidance for anyone (human or AI) working in this repo. Read this before making
changes. Product/architecture detail lives in [`docs/`](./docs) — PRD, TECHSTACK,
dev-plan, and especially **[`architecture.md`](./docs/architecture.md)** + the
decision records in **[`docs/adr/`](./docs/adr)**.

## System design — read before building a feature

Finlio is **one system with two clients** (web now, React Native mobile later), so
**how** you build matters as much as what. Read
[`docs/architecture.md`](./docs/architecture.md) first. The load-bearing rules:

- **Monorepo** (Turborepo + pnpm): the web app lives in `apps/web`, `apps/mobile`
  comes later, shared code goes in `packages/*` (`core`, `schemas`, `tokens` are
  seeded empty) ([ADR-0001](./docs/adr/0001-monorepo-turborepo-pnpm.md)). Run
  everything from the root via pnpm (`pnpm dev` / `pnpm build` / `pnpm lint` →
  Turbo). Use **pnpm**, not npm.
- **Share logic and values, never views.** Domain logic, Zod schemas, API client,
  and design tokens go in `packages/*`; UI components are per-platform.
- **API boundary** ([ADR-0002](./docs/adr/0002-api-boundary.md)): business logic in
  `packages/core`; **tRPC** for app data; **REST** route handlers for
  webhooks/integrations; **Server Actions are thin wrappers only** — never put
  logic there that mobile will also need (RN can't call Server Actions).
- Auth = Supabase JWT + injectable storage adapter. On-device data = a
  `MarkdownStore` interface with web/native adapters. Entitlements are server-side
  (DodoPayments → Supabase); mind app-store IAP rules.

## Product positioning (keep copy & docs consistent)

- **India-first, global later.** Build for Indian investors and the NRI diaspora
  first (INR, EPF/PPF/NPS/SGB, AA, SEBI framing). Global markets are a *scale*
  goal, not a launch goal — don't write copy or docs that imply a worldwide
  launch now.
- **Web/desktop first, mobile next.** The product ships on the **web (desktop)**
  first. Native **mobile apps for both iOS and Android** (React Native) come
  **at scale**, after the web product lands. Don't describe Finlio as a
  "mobile app" in current-tense marketing copy — it's a web product today with
  mobile coming.
- **Suggest, never execute.** Finlio advises; it never places trades or moves
  money. Every AI-generated output carries a "not investment advice" disclaimer.

## Branches & merging (enforced on `main`)

- **`main` is protected. All changes land via Pull Request — no direct pushes,
  by anyone (admins included).** Branch → PR → CI green → merge.
- Merges are **squash** merges; the head branch is auto-deleted afterwards.
- Keep branches short-lived. Suggested names: `feat/…`, `fix/…`, `chore/…`,
  `docs/…`, `ci/…`.
- CI (below) must be green before a PR can merge.

## Commits — Conventional Commits (enforced)

Every commit message must follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <summary>
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- Examples: `feat(waitlist): add referral field`, `fix(email): verify webhook
  signature`, `docs(prd): clarify India-first positioning`,
  `chore(deps): bump next`.
- Enforced **locally** by the `commit-msg` hook (Lefthook → commitlint) and **in
  CI** (the `Commit messages` job lints every commit in a PR). Config:
  [`commitlint.config.mjs`](./commitlint.config.mjs).

## Git hooks — Lefthook

Config: [`lefthook.yml`](./lefthook.yml). Installed automatically on
`pnpm install` (via the `prepare` script); run `pnpm exec lefthook install` to
(re)install.

- **pre-commit** — ESLint (via `pnpm turbo run lint`) when `apps/web` source is staged.
- **commit-msg** — commitlint (Conventional Commits).
- **pre-push** — `pnpm turbo run lint`.

Bypass only in a genuine emergency with `--no-verify`; CI enforces the same
rules, so a bypass just moves the failure to the PR.

## Tests are part of the work, not a follow-up

**Write Vitest coverage alongside any core code you add.** "Core" means anything
whose breakage is silent or expensive:

- domain / finance logic (net worth, XIRR, goal planner, inflation) — `packages/core`
- data access and storage seams (`src/lib/*`, `src/db/*`), server actions, route
  handlers, webhook verification
- money-, email-, auth-, or entitlement-touching paths
- **every bug you fix** — add the regression test that would have caught it

Trivial presentational markup and pure styling don't need tests. Use judgement,
but default to writing them.

Rules:
- **A merge requires green tests.** `Lint · Typecheck · Test · Build` is a
  required status check on `main` and `enforce_admins` is on — nobody, including
  admins, can merge a red build. Don't try to route around it; fix the test or
  the code.
- Tests must pass on a **clean checkout with no services running** — mock
  Supabase (`@/db`), Resend, and any network. Never point tests at a real DB.
- Test behaviour through the public/accessible API, not internals.
- Conventions and the two-project (node/jsdom) setup:
  [`docs/TECHSTACK.md`](./docs/TECHSTACK.md) §10.

Run locally before pushing (the pre-push hook does this too):

```bash
pnpm turbo run lint typecheck test build
```

## CI

Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). On every PR
(and push to `main`):

- **verify** — install, lint, typecheck, test (`--if-present` until the scripts
  exist), and `next build` (build also typechecks).
- **commitlint** — Conventional-Commits check on the PR's commits.

Notes:
- Don't require the **Vercel** check — Vercel's Hobby plan can't deploy repos
  owned by a GitHub org, so it fails regardless. Preview deploys need Vercel Pro.
- `next build` needs a non-empty `RESEND_API_KEY`; CI passes a dummy build key
  (real key is a Vercel secret, used only at request time).

## Dependencies — Dependabot

Config: [`.github/dependabot.yml`](./.github/dependabot.yml). Weekly grouped PRs
for npm + GitHub Actions, labelled and Conventional-Commit prefixed
(`chore(deps)` / `ci`). **TypeScript and ESLint majors are held** (ignore rules)
— adopt those deliberately, then remove the ignore.

## This is a PUBLIC repo

- **Never commit secrets** (API keys, tokens, `.env`). Secret scanning + push
  protection are enabled on GitHub; if a push is blocked, rotate the secret —
  don't bypass. Secrets live in Vercel / GitHub Actions secrets. Keep
  `.env.example` valueless.
- Assume everything here is world-readable. Don't paste customer data, internal
  URLs, or private tokens into code, issues, or commit messages.

## Framework notes

- **Next.js 16.3** (App Router, RSC, Turbopack) + React 19 (React Compiler on).
  Its APIs differ from older Next — read the relevant guide under
  `node_modules/next/dist/docs/` before writing app code (see `AGENTS.md`).
- Don't run `next build` while `next dev` is running — both write `.next` and
  can corrupt the dev manifest. Stop dev, `rm -rf .next`, then build.
