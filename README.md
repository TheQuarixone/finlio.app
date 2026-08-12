# Finlio

Finlio tells you why the stocks and mutual funds you own went up or down. One
short message every market morning, before the open, in plain English.

This repository is the waitlist landing page.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- TypeScript

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Script          | What it does                  |
| --------------- | ----------------------------- |
| `npm run dev`   | Dev server                    |
| `npm run build` | Production build              |
| `npm run lint`  | ESLint                        |

> Do not run `next build` while `next dev` is running. Both write to `.next`
> and the dev server's client manifest can be left corrupted, which shows up
> as client components silently failing to hydrate. Stop the dev server,
> `rm -rf .next`, then build.

## How it is put together

```
src/app/page.tsx          Whole landing page (server component)
src/app/actions.ts        Server Action that handles waitlist signups
src/app/globals.css       Design tokens + all keyframes
src/components/           Client bits: form, FAQ, rotating word, decor
src/lib/ui.ts             Shared button and icon surface treatments
src/lib/waitlist.ts       Waitlist persistence
```

### Waitlist storage

Signups append to `.data/waitlist.json`, which is gitignored. This is a
deliberate placeholder so the page works end to end without infrastructure.
Swap `src/lib/waitlist.ts` for a real database before launch. The signup
counter is already implemented but hidden; see the comment in
`src/components/waitlist-form.tsx` to bring it back.

### Motion

Scroll effects use CSS scroll-driven animations (`animation-timeline: view()`)
and ship no JavaScript. Only the `from` state is declared in each keyframe, so
the resting state is the element's natural style — if a browser lacks scroll
timeline support the content simply shows, and a section can never be left
blank by a script that failed to run. Everything is disabled under
`prefers-reduced-motion`, and the word-by-word blur drops to a plain fade
under 640px because a per-frame blur across ~100 spans janks on low-end
phones.

### Design

The visual language is adapted from [family.co](https://family.co): a white
page with one warm off-white for panels, near-black pill buttons with a raised
bevel, and saturated accents used to colour-code each section. Colour and type
tokens live in `src/app/globals.css`.

### Third-party logos

`public/logos/` holds official App Store icons for Indian broker, fund and
news apps, shown referentially in the About section. Worth a trademark check
before public launch.

## Before launch

- [ ] Replace the file-backed waitlist with a database
- [ ] Add a privacy policy and terms, and link them in the footer
- [ ] Add real social handles (`SOCIALS` in `src/app/page.tsx`, currently
      commented out)
- [ ] Have the "not investment advice" and SEBI wording reviewed
- [ ] Point `finlio.app` at the deployment and set `metadataBase` for OG tags
