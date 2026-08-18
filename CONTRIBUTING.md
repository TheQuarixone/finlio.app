# Contributing to Finlio

Short version: branch, commit in Conventional Commits, open a PR, get CI green,
merge. `main` is protected — nothing lands any other way.

## Setup

```bash
pnpm install                      # installs deps and git hooks
cp apps/web/.env.example apps/web/.env.local
pnpm dev                          # http://localhost:3000
```

A local database is optional for the landing page but required for the waitlist —
see [`docs/local-supabase.md`](./docs/local-supabase.md).

## Branch → PR → merge

- Branch off `main`: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `ci/…`
- **All changes land via Pull Request.** No direct pushes, admins included.
- Merges are **rebase** merges, so keep commits scoped and meaningful — they
  land on `main` as-is.
- Delete the branch after merge (automatic).

## Commits

[Conventional Commits](https://www.conventionalcommits.org), enforced by the
`commit-msg` hook and again in CI:

```
<type>(<optional scope>): <summary>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
`ci`, `chore`, `revert`.

## Definition of done

A change is done when:

- [ ] Tests ship **with** the code — domain logic, data seams, server actions,
      route handlers, money/auth paths, and **every bug fix gets a regression
      test**. See [`CLAUDE.md`](./CLAUDE.md).
- [ ] `pnpm turbo run lint typecheck test build` passes locally
- [ ] Docs updated if behaviour or config changed (including `.env.example` —
      all three env files move together, see the convention in `CLAUDE.md`)
- [ ] The phase-doc checkbox is ticked with the PR linked
      ([`docs/phase-1.md`](./docs/phase-1.md))

## Tracking work

Phase docs are the board. Claim a task by putting your handle in **Owner**, and
tick `[x]` when the PR merges. Keep the notes honest — a partially-done task
says so rather than being ticked optimistically.

## Security

This is a **public repo**. Never commit secrets: `.env*` is gitignored except
`.env.example`, which stays valueless. Secret scanning and push protection are
on — if a push is blocked, rotate the secret rather than bypassing.
