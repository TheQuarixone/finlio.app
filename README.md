<div align="center">

# Finlio

**Know why your money moved.**

Every market morning, before the open, Finlio sends you one short message — in
plain English, not share-market jargon — explaining why the stocks and mutual
funds *you own* may go up or down today.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![CI](https://github.com/TheQuarixone/Finlio.app/actions/workflows/ci.yml/badge.svg)](https://github.com/TheQuarixone/Finlio.app/actions/workflows/ci.yml)

</div>

---

## About

Finlio is an AI-native, privacy-first personal-finance product for India (NRIs
included), built web-first with native iOS + Android to follow at scale. This
repository currently hosts the **waitlist landing page**; the product is specced
in [`docs/`](./docs).

- 🇮🇳 **India-first**, global later
- 🖥️ **Web/desktop first**, mobile (iOS + Android) at scale
- 🔒 **Privacy by design** — raw financial data stays on-device
- 🤝 **Suggest, never execute** — Finlio explains; it never trades or gives regulated advice

> **Status:** pre-launch. This is the waitlist site, not the product app.

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, RSC, Turbopack) · **React 19** (React Compiler)
- **TypeScript** (strict) · **Tailwind CSS v4**
- **[GSAP](https://gsap.com)** (ScrollSmoother + ScrollTrigger) — smooth scroll & reveals
- **[Resend](https://resend.com)** + **[React Email](https://react.email)** — waitlist + transactional email
- **[Vercel](https://vercel.com)** hosting · **GitHub Actions** CI · **Dependabot**

Full architecture and the planned Turborepo monorepo layout live in
[`docs/architecture.md`](./docs/architecture.md) and [`docs/adr/`](./docs/adr).

## Getting started

**Prerequisites:** Node.js 22+ and npm.

```bash
git clone https://github.com/TheQuarixone/Finlio.app.git
cd Finlio.app
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>.

### Environment

See [`.env.example`](./.env.example) for the full list. At minimum the waitlist
needs Resend configured:

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=       # e.g. "Finlio <hello@finlio.app>"
RESEND_WEBHOOK_SECRET=   # verifies inbound-email webhooks
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run email:dev` | Preview React Email templates locally |

> Don't run `next build` while `next dev` is running — both write `.next` and
> can corrupt the dev manifest. Stop dev, `rm -rf .next`, then build.

## Project structure

```
src/app/            App Router pages, layout, server actions, API routes
src/components/     Landing-page UI (header, hero, decor, FAQ, forms) + smooth-scroll
src/lib/            Waitlist + email (Resend), shared UI helpers
emails/             React Email templates
docs/               PRD, architecture, ADRs, dev plan
.github/            CI workflow + Dependabot
```

## Documentation

| Doc | Purpose |
| --- | --- |
| [PRD](./docs/PRD.md) | What we're building |
| [Architecture](./docs/architecture.md) | System design & the web↔mobile boundary |
| [ADRs](./docs/adr) | Key decisions (monorepo, API boundary, storage) |
| [Dev plan](./docs/dev-plan.md) | Roadmap & phases |

## Contributing

`main` is protected — **all changes land via Pull Request** (no direct pushes).

- **Conventional Commits** are enforced (Lefthook `commit-msg` + CI). e.g.
  `feat(waitlist): add referral field`.
- Hooks install automatically on `npm install` (via `prepare` → `lefthook install`):
  pre-commit ESLint, commit-msg commitlint, pre-push lint/test.
- CI (lint · typecheck · test · build + commit-message check) must be green to merge.

See [`CLAUDE.md`](./CLAUDE.md) for the full working rules.

## License

Licensed under the **GNU Affero General Public License v3.0 or later
(AGPL-3.0-or-later)** — see [`LICENSE`](./LICENSE). The AGPL's network-use
clause means that running a modified version as a network service also triggers
the obligation to share source. Copyright © 2026 Quarix / Gokulakrishnan.
