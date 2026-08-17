# Finlio

**Know why your money moved.** Every market morning, before the open, Finlio
sends you one short message explaining — in plain English, not share-market
jargon — why the stocks and mutual funds *you own* may go up or down today.

This repository is the **waitlist landing page**. The full product is specced in
[`docs/`](./docs).

- [Product requirements (PRD)](./docs/PRD.md) — what Finlio is
- [Tech stack & architecture](./docs/TECHSTACK.md) — how it's built
- [Development plan](./docs/dev-plan.md) + [Phase 1 board](./docs/phase-1.md) — when

---

## Stack

- **Next.js 16** (App Router, RSC, Turbopack) · **React 19** (React Compiler on)
- **Tailwind CSS v4** — design tokens in `src/app/globals.css`
- **TypeScript** (strict)
- **Resend** — waitlist contacts, confirmation email, inbound relay
- **GSAP** (ScrollSmoother + ScrollTrigger) — smooth scrolling and scroll reveals

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Script          | What it does     |
| --------------- | ---------------- |
| `npm run dev`   | Dev server       |
| `npm run build` | Production build |
| `npm run lint`  | ESLint           |

Environment variables (see the deployment notes in
[`docs/TECHSTACK.md`](./docs/TECHSTACK.md#9-environments--configuration)):

```
RESEND_API_KEY=          # required for signups + emails
RESEND_FROM_EMAIL=       # e.g. "Finlio <hello@finlio.app>"
RESEND_WEBHOOK_SECRET=   # verifies inbound email webhooks
```

> Do not run `next build` while `next dev` is running — both write to `.next`
> and the dev server's client manifest can be corrupted, which shows up as
> client components silently failing to hydrate. Stop dev, `rm -rf .next`, then
> build.

## How it's put together

```
src/app/page.tsx                         Whole landing page (server component)
src/app/layout.tsx                       Root layout; wraps the page in <SmoothScroll>
src/app/actions.ts                       Server Action for waitlist signups
src/app/api/webhooks/resend-inbound/     Relays mail sent to hello@finlio.app
src/app/globals.css                      Design tokens, keyframes, CSS reveals (fallback)
src/components/smooth-scroll.tsx         GSAP smooth scroll + scroll-triggered reveals
src/components/                          Client bits: form, FAQ, rotating word, hero decor
src/lib/ui.ts                            Shared flat button + app-icon surfaces
src/lib/waitlist.ts                      Waitlist storage (Resend contacts)
src/lib/email.ts                         Waitlist confirmation email
```

### Waitlist storage

Signups are stored as **Resend contacts** (`src/lib/waitlist.ts`) — not a local
file. A serverless filesystem is read-only outside `/tmp`, and `/tmp` doesn't
persist across invocations, so file-backed storage silently loses data in
production. New signups also get a confirmation email (`src/lib/email.ts`). The
signup counter is implemented but hidden pre-launch — see the note in
`src/components/waitlist-form.tsx`.

### Motion

Scrolling and scroll reveals are driven by **GSAP** in
`src/components/smooth-scroll.tsx`:

- **ScrollSmoother** wraps the page (`#smooth-wrapper` / `#smooth-content`) and
  lags content against native scroll for a weighted feel.
- **ScrollTrigger** drives the reveals: sections and cards fade + rise as they
  enter, and the story sharpens **word by word**, left to right, with each
  line's app icons popping in just after.

This is **progressive enhancement**. The wrapper markup is identical before and
after hydration, and GSAP only takes over when it actually runs — it adds a
`gsap-smooth` class to `<html>`, which switches off the CSS-only reveal system
that `globals.css` ships as a fallback. So:

- **No JavaScript / GSAP fails to load** → the page scrolls natively and the CSS
  scroll-timeline reveals (`animation-timeline: view()`) take over. Nothing is
  left hidden — each keyframe only declares its `from` state, so the resting
  state is the element's natural (visible) style.
- **`prefers-reduced-motion`** → GSAP is skipped entirely and all reveals are
  disabled; content is simply shown.

> Because ScrollSmoother is driven by `requestAnimationFrame`, the smooth-scroll
> feel only appears in a **foreground browser tab** (rAF is paused in hidden or
> backgrounded tabs). This is normal and self-heals when the tab is focused.

### Design

Flat and quiet, adapted from [family.co](https://family.co): a white page, one
warm off-white for panels, near-black solid pill buttons, and saturated accents
to colour-code each section. **Definition comes from hairline rings and colour —
never drop shadows.** Colour and type tokens live in `src/app/globals.css`.

### Third-party logos

`public/logos/` holds official App Store icons for Indian broker, fund, and news
apps, shown referentially in the About section. Worth a trademark check before
public launch.

## Before launch

- [ ] Add a privacy policy and terms, and link them in the footer
- [ ] Add real social handles (`SOCIALS` in `src/app/page.tsx`, currently commented out)
- [ ] Have the "not investment advice" and SEBI wording reviewed
- [ ] Point `finlio.app` at the deployment and set `metadataBase` for OG tags
