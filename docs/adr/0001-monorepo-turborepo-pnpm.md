# ADR-0001 — Monorepo with Turborepo + pnpm

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** Gokulakrishnan, team

## Context

Finlio ships **web first**, then native **iOS + Android** (React Native / Expo) at
scale. A large amount of logic is inherently shared — domain/finance calculations,
Zod schemas, the API client, agent logic, design tokens. Today the repo is a single
small Next.js 16.3 waitlist app, so restructuring is cheap; retrofitting a monorepo
around a mature web app plus a new mobile app later is expensive and error-prone.

## Decision

Adopt a **monorepo** managed by **Turborepo**, using **pnpm workspaces**.

Structure (see [`../architecture.md`](../architecture.md) §2):

```
apps/web, apps/mobile
packages/core, schemas, api, data, tokens, config
```

- **pnpm** over npm workspaces — stricter dependency isolation, faster installs,
  better suited to multiple apps sharing packages. (npm workspaces would also work;
  pnpm is the deliberate call for a multi-app repo.)
- **Turborepo** for the task graph (build/lint/typecheck/test/dev) with **remote
  caching** (Vercel) to keep CI fast.
- Seed shared packages **empty** and extract into them as Phase-1 features need
  them — no speculative packages.

## Migration plan (executed as its own PR, when the frontend WIP is committed)

> Do **not** run this while a large uncommitted frontend WIP is in flight — it moves
> files out from under live edits. Land the WIP first.

1. Move the current app into `apps/web/`.
2. Add root `package.json` (pnpm workspaces) + `pnpm-workspace.yaml` + `turbo.json`
   with the task pipeline.
3. Add `packages/config` (shared eslint/tsconfig/tailwind preset); point `apps/web`
   at it. Seed empty `packages/core`, `schemas`, `tokens`.
4. Convert lockfile to pnpm; update the `prepare`/Lefthook wiring to run from root.
5. Update CI to run `turbo run lint typecheck test build`; **keep the job name
   `Lint · Typecheck · Test · Build`** so branch-protection required checks still
   match.
6. Set the **Vercel project root directory** to `apps/web`.
7. One PR → verify preview → merge.

## Consequences

**Positive**
- Mobile becomes additive: it consumes the same `packages/*` instead of duplicating.
- One lint/test/build graph; cached, fast CI.
- Forces the shared-vs-platform boundary early (the real reason to do it now).

**Negative / costs**
- Slightly more config up front (workspaces, turbo, pnpm).
- pnpm's stricter resolution can surface hidden/peer-dependency issues (a feature,
  but needs a pass during migration).
- Contributors must have pnpm installed.

## Alternatives considered

- **Stay single-repo, split later.** Rejected — retrofitting a monorepo around a
  mature app + new mobile app is the expensive path we're avoiding.
- **npm/yarn workspaces without Turbo.** Works, but loses the cached task graph;
  Turbo is low-cost and high-value for a multi-app repo.
- **Nx.** More powerful/opinionated than we need right now; Turbo is lighter and
  pairs cleanly with Vercel.
