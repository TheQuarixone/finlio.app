"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

/* GSAP-powered smooth scrolling for the marketing page.

   ScrollSmoother wraps the page in #smooth-wrapper / #smooth-content and lags
   the content against native scroll for a weighted, premium feel. `effects:
   true` turns on the `data-speed` / `data-lag` parallax attributes used by the
   hero decor and the brief card.

   Progressive enhancement is deliberate:
   - The wrapper/content divs render on the server, so markup is identical
     before and after hydration.
   - If JavaScript never runs, or the visitor prefers reduced motion, the page
     just scrolls natively — nothing is hidden or broken.
   - Smoothing is applied to pointer/wheel only; touch keeps native scrolling
     (smoothTouch defaults to 0) so mobile forms and taps behave normally. */

// useLayoutEffect on the client (runs before paint, avoids a smoothing flash),
// useEffect on the server (avoids the SSR warning).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function SmoothScroll({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useIsoLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Smoothing is a landing-page treatment, and it is not free elsewhere: the
       smoother's transformed content stops `position: sticky` from ever
       sticking, which the legal pages rely on for their contents rail. Off
       every route but the landing page, this leaves native scrolling in place
       and the wrapper divs as plain, harmless markup. */
    if (pathname !== "/") return;

    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    // Tell the stylesheet to stand down: the CSS scroll-timeline reveals can't
    // advance inside a fixed smooth-wrapper, so ScrollTrigger drives them now.
    const root = document.documentElement;
    root.classList.add("gsap-smooth");

    // Phones dropped the per-word blur in CSS for the same GPU-cost reason;
    // keep that trade-off here.
    const isSmall = window.matchMedia("(max-width: 640px)").matches;

    let smoother: ScrollSmoother | undefined;

    const ctx = gsap.context(() => {
      smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current!,
        content: contentRef.current!,
        smooth: 1.2,
      });

      // Responsive pins/animations register through this; reverted with the ctx.
      const mm = gsap.matchMedia();

      // 1) Sections / cards / eyebrows: fade + rise as each enters. Batched so
      //    siblings sharing a scroll position come in with a light stagger.
      gsap.set(".reveal-rise", { autoAlpha: 0, y: 18 });
      ScrollTrigger.batch(".reveal-rise", {
        start: "top 88%",
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.09,
            overwrite: true,
          }),
      });

      // 2) The story reveals *with* the scroll. Each line's words sharpen from
      //    dim/blurred to crisp, left to right, scrubbed to scroll position — so
      //    the sentence uncovers itself as you read down it (and re-veils if you
      //    scroll back up). Its app icons pop in as the line finishes.
      gsap.utils.toArray<HTMLElement>(".reveal-line").forEach((line) => {
        const words = line.querySelectorAll(".reveal-word");
        const icons = line.querySelectorAll(".reveal-icons > *");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: line,
            start: "top 90%",
            end: "top 42%",
            scrub: 0.6,
          },
        });

        tl.fromTo(
          words,
          isSmall
            ? { autoAlpha: 0.18 }
            : { autoAlpha: 0.12, filter: "blur(6px)" },
          {
            autoAlpha: 1,
            filter: isSmall ? undefined : "blur(0px)",
            ease: "none",
            duration: 1,
            stagger: 0.6,
          }
        );

        if (icons.length)
          tl.fromTo(
            icons,
            { autoAlpha: 0, scale: 0.4, y: 8 },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              ease: "back.out(1.8)",
              duration: 1,
              stagger: 0.4,
            },
            ">-0.5"
          );
      });

      // 3) Closing brief card: its rows fade + rise one after another.
      gsap.from("[data-brief-row]", {
        scrollTrigger: { trigger: "[data-brief]", start: "top 80%", once: true },
        y: 16,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.1,
      });

      // 4) Desktop only: pin the "from the Finlio team" rail so it holds while
      //    the story scrolls past it. CSS position:sticky can't be used here —
      //    ScrollSmoother's transformed content stops it from ever sticking — so
      //    we pin via ScrollTrigger, which is built to work under the smoother.
      //    matchMedia unpins (and cleans up) below the lg breakpoint, where the
      //    rail simply stacks above the story.
      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: "#about",
          start: "top top+=96",
          end: "bottom bottom-=96",
          pin: "[data-about-aside]",
          pinSpacing: false,
        });
      });

      // Deep-link: honour a real section hash on load; drop the internal #top.
      const initial = window.location.hash;
      if (initial === "#top") {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      } else if (initial) {
        const target = document.querySelector(initial);
        if (target) smoother?.scrollTo(target, false, "top 84px");
      }

      // Heights only settle once fonts, images and the smooth-content transform
      // are in place; recompute trigger positions so nothing stays hidden.
      ScrollTrigger.refresh();
    });

    // Route in-page anchor links (nav + CTAs) through the smoother so they
    // glide instead of jumping, and land clear of the sticky top offset.
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // Shared chrome writes section links as `/#hash` so they also work from
      // the legal routes. This only ever runs on the landing page, so both
      // forms point at a section of the current document.
      const link = (event.target as HTMLElement)?.closest?.(
        'a[href^="#"], a[href^="/#"]'
      ) as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      const hash = href.slice(href.indexOf("#"));
      if (hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target || !smoother) return;
      event.preventDefault();
      // #top goes fully to the top with a clean URL; everything else lands just
      // below the fixed header pill (~64px) and keeps its deep-linkable hash.
      if (hash === "#top") {
        smoother.scrollTo(0, true);
        history.pushState(null, "", location.pathname + location.search);
      } else {
        smoother.scrollTo(target, true, "top 84px");
        history.pushState(null, "", hash);
      }
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      ctx.revert();
      /* Explicit kill, not just the context revert: this runs when a client-side
         navigation leaves the landing page, and the smoother has to hand back
         the inline styles it wrote on the wrapper, the content and the body.
         Left in place, the fixed wrapper would clip a legal page to one
         viewport. `get()` returns nothing if the revert already took it, which
         keeps this safe to call either way. */
      ScrollSmoother.get()?.kill();
      root.classList.remove("gsap-smooth");
    };
  }, [pathname]);

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
