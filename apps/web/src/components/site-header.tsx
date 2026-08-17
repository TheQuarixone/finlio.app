"use client";

import { usePathname } from "next/navigation";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Logo } from "@/components/logo";
import { buttonPrimary } from "@/lib/ui";

/* Fixed site header. Rendered OUTSIDE #smooth-content (see layout.tsx) so it
   stays put — a position:fixed element inside ScrollSmoother's transformed
   content would scroll away with the page.

   Two personalities, one element:
   - In the hero it is *docked*: transparent, full-width, and it moves 1:1 with
     the hero content (its transform tracks the smoother's rendered position),
     so it reads as part of the hero rather than a bar floating over it.
   - Past the hero it is a floating *pill* that behaves like IKEA's header:
     tucked away while you scroll down, and the moment you scroll up it drops
     back in. Snappy: ~200ms out, ~300ms expo-out in.
   On phones the nav collapses into a toggle that drops a full-width panel. */

const NAV_LINKS = [
  { label: "How it works", href: "#about" },
  { label: "FAQs", href: "#faqs" },
];

/* The mobile panel lists the nav links plus the CTA, each staggering in. */
const MENU_ITEMS = [
  ...NAV_LINKS.map((link) => ({ ...link, cta: false })),
  { label: "Join waitlist", href: "#waitlist", cta: true },
];

/* Scroll-state machine (see the effect below).
   - docked: in the hero, transform is scroll-linked (no transition).
   - parked: out of view, no transition pending; waiting for a reason to show.
   - hidden: past the hero, tucked up (animated out).
   - shown:  past the hero, dropped in (animated in).
   - forced: menu open or keyboard focus inside — always shown. */
type Mode = "docked" | "parked" | "hidden" | "shown" | "forced";

const HIDDEN = "translateY(-120%)";
const SHOWN = "translateY(0)";
const REVEAL_T = "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)";
const HIDE_T = "transform 220ms cubic-bezier(0.4, 0, 0.6, 1)";
/* Scroll distance (px) past which the docked bar is fully off-screen. */
const DOCK_EXIT = 120;
/* How far (px) the user must reverse before the pill reacts. Filters trackpad
   jitter without feeling laggy. */
const INTENT = 6;

/* Visual chrome. `animate` is false when the swap happens off-screen (docked
   ↔ parked), so the bar never visibly morphs while sliding into view; true
   when the swap is on-screen (menu opening at the top of the page). */
type Chrome = { pill: boolean; animate: boolean };

export function SiteHeader() {
  /* The nav points at sections of the landing page. On the landing page itself
     the links stay bare hashes, which is what the smooth-scroll handler
     intercepts to glide; from a legal route they need the leading "/" to get
     home first. */
  const hashPrefix = usePathname() === "/" ? "" : "/";
  const [chrome, setChrome] = useState<Chrome>({ pill: false, animate: false });
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const openRef = useRef(false);
  const focusRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    /* The hero ends (for our purposes) a little before its true bottom, so
       the pill can never overlap the hero's tail. Re-measured on resize and
       whenever the hero's height settles (fonts, images). */
    let heroEnd = window.innerHeight;
    const hero = document.getElementById("top");
    const measure = () => {
      heroEnd = (hero ? hero.offsetHeight : window.innerHeight) - 80;
    };
    measure();
    const ro = hero && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measure)
      : null;
    ro?.observe(hero!);
    window.addEventListener("resize", measure, { passive: true });

    let mode: Mode = "docked";
    let lastY = window.scrollY;
    let lastS = -1;
    let upRun = 0;
    let downRun = 0;

    const place = (transform: string, transition: string) => {
      el.style.transition = transition;
      el.style.transform = transform;
    };

    const tick = () => {
      /* Two scroll positions matter under ScrollSmoother:
         - `s` is where the content is actually rendered (lags the wheel).
           The docked bar must follow this, or it would drift off the hero.
         - `y` is where the user has asked to be (native scroll). Direction
           comes from here so the pill reacts to intent instantly, not after
           the smoothing catches up. Without the smoother they're the same. */
      const smoother = ScrollSmoother.get();
      const s = smoother ? smoother.scrollTop() : window.scrollY;
      const y = Math.max(0, window.scrollY);
      const forced = openRef.current || focusRef.current;

      if (forced) {
        if (mode !== "forced") {
          mode = "forced";
          place(SHOWN, REVEAL_T);
          setChrome({ pill: true, animate: true });
        }
        lastY = y;
        lastS = s;
        return;
      }
      /* Was the bar on screen going into this frame? Decides whether a chrome
         swap should animate (visible) or be instant (off-screen). */
      const wasVisible = mode === "forced" || mode === "shown";
      if (mode === "forced") {
        // Released: pretend we're shown and let the branches below re-place.
        mode = "shown";
        upRun = downRun = 0;
      } else if (s === lastS && y === lastY) {
        return;
      }

      const dy = y - lastY;
      if (dy > 0) {
        downRun += dy;
        upRun = 0;
      } else if (dy < 0) {
        upRun -= dy;
        downRun = 0;
      }
      lastY = y;
      lastS = s;

      const inHero = s < heroEnd;

      if (inHero && s < DOCK_EXIT) {
        // A) Docked: ride along with the hero content, no easing.
        if (mode !== "docked") {
          mode = "docked";
          setChrome({ pill: false, animate: wasVisible });
        }
        place(`translateY(${-s}px)`, "none");
      } else if (inHero) {
        // B) Still in the hero but the bar has scrolled out. Nothing to show
        //    here; the header belongs to the hero and returns with it. If the
        //    pill was up (we're scrolling back into the hero), tuck it away.
        if (mode === "docked") {
          mode = "parked";
          place(HIDDEN, "none");
          setChrome({ pill: true, animate: false });
        } else if (mode === "shown") {
          mode = "hidden";
          place(HIDDEN, HIDE_T);
        }
        upRun = downRun = 0;
      } else {
        // C) Past the hero: hide on scroll down, reveal on scroll up.
        if (mode === "docked") {
          mode = "parked";
          place(HIDDEN, "none");
          setChrome({ pill: true, animate: false });
        }
        if (upRun > INTENT && mode !== "shown") {
          mode = "shown";
          place(SHOWN, REVEAL_T);
        } else if (downRun > INTENT && mode === "shown") {
          mode = "hidden";
          place(HIDDEN, HIDE_T);
        }
      }
    };

    /* gsap.ticker (not a scroll listener): under the smoother the content
       keeps moving after the last scroll event, and the docked bar has to
       follow it frame by frame. */
    gsap.ticker.add(tick);
    tick();

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  /* Keyboard users: if focus lands inside the header while it's tucked away,
     bring it in so the focused link is visible. Only keyboard focus counts
     (:focus-visible); a mouse click on a link must not morph the docked bar. */
  const onFocus = (event: React.FocusEvent) => {
    const target = event.target as HTMLElement;
    if (target.matches?.(":focus-visible")) focusRef.current = true;
  };
  const onBlur = (event: React.FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      focusRef.current = false;
    }
  };

  // Collapse the mobile panel if the viewport grows to the desktop nav.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  const pill = chrome.pill || open;
  const morph = chrome.animate
    ? "duration-[350ms] ease-[cubic-bezier(0.2,0,0,1)]"
    : "duration-0";

  return (
    <>
      {/* Scrim: dims + softens the page behind the open menu, and closes it on
          outside tap. Kept OUTSIDE the header — the header's backdrop-blur makes
          it a containing block, which would collapse a fixed scrim to its own
          height. z-40 sits above the page content but below the header (z-50). */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.2,0,0,1)] md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Transform AND its transition are driven imperatively by the scroll
          effect: scroll-linked (no transition) while docked in the hero,
          eased when the pill drops in / tucks away past the hero. */}
      <header
        ref={headerRef}
        onFocus={onFocus}
        onBlur={onBlur}
        className="fixed inset-x-0 top-0 z-50 will-change-transform"
      >
        {/* Centering track: only its max-width animates, so on desktop the pill
            contracts smoothly toward centre; on mobile both widths exceed the
            viewport, so it's a no-op there. */}
        <div
          className={`mx-auto transition-[max-width] ${morph} ${
            pill ? "max-w-3xl" : "max-w-6xl"
          }`}
        >
          {/* Chrome layer: explicit margins (never `auto`) so the inset and the
              downward float interpolate instead of snapping. Docked = bare and
              transparent, part of the hero; pill = frosted, ringed, lifted. */}
          <div
            className={`flex items-center justify-between transition-[margin,padding,box-shadow,border-radius,background-color] ${morph} ${
              pill
                ? "mx-4 mt-3 gap-2 rounded-full bg-white/90 px-4 py-2 shadow-[0_12px_32px_-16px_rgba(52,52,51,0.22)] ring-1 ring-line backdrop-blur-xl"
                : "mx-0 mt-0 gap-4 rounded-none bg-transparent px-4 py-4 sm:px-6"
            }`}
          >
        <a href={`${hashPrefix}#top`} aria-label="Finlio home" className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40">
          <Logo layout="inline" />
        </a>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-8 text-[15px] font-medium">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={`${hashPrefix}${link.href}`}
                  className="text-body/70 transition-colors duration-200 hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Wrapper controls visibility — the button itself is always
              inline-flex (from buttonPrimary), which would defeat a bare
              `hidden` on the anchor. */}
          <span className="hidden md:contents">
            <a
              href={`${hashPrefix}#waitlist`}
              className={`h-10 px-5 text-[14px] ${buttonPrimary}`}
            >
              Join waitlist
            </a>
          </span>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative -mr-1.5 inline-flex size-11 items-center justify-center rounded-xl text-ink outline-none transition-colors hover:bg-sand focus-visible:ring-2 focus-visible:ring-brand-blue/40 md:hidden"
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 block h-0.5 w-full rounded-full bg-current transition-[top,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-0.5 w-full -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-full rounded-full bg-current transition-[bottom,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                  open ? "bottom-1/2 translate-y-1/2 -rotate-45" : "bottom-0.5"
                }`}
              />
            </span>
          </button>
        </div>
          </div>
        </div>

      {/* Mobile drop panel: an absolutely-positioned card that grows from the
          top while its items stagger in. (A grid-rows height animation collapses
          to 0 inside this fixed header, since 1fr has no definite height.) */}
      <div
        className={`absolute inset-x-0 top-full origin-top px-4 pt-1 transition-[opacity,transform] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.97] opacity-0"
        }`}
      >
        <nav className="rounded-2xl border border-line bg-white p-2">
          <ul className="flex flex-col gap-1">
            {MENU_ITEMS.map((item, i) => (
              <li
                key={item.href}
                style={{ transitionDelay: open ? `${90 + i * 55}ms` : "0ms" }}
                className={`transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  item.cta ? "mt-1" : ""
                } ${open ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"}`}
              >
                {item.cta ? (
                  <a
                    href={`${hashPrefix}${item.href}`}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className={`h-12 w-full text-[15px] ${buttonPrimary}`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <a
                    href={`${hashPrefix}${item.href}`}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className="flex min-h-[48px] items-center rounded-xl px-3 text-[16px] font-medium text-ink transition-colors hover:bg-sand"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
    </>
  );
}
