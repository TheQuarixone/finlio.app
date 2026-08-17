"use client";

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

  useIsoLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

      // 2) The story: each line sharpens word by word, left to right, and its
      //    app icons pop in just after the words land.
      const wordsFrom = isSmall
        ? { autoAlpha: 0.25 }
        : { autoAlpha: 0.2, filter: "blur(5px)" };
      const wordsTo = isSmall
        ? { autoAlpha: 1 }
        : { autoAlpha: 1, filter: "blur(0px)" };

      gsap.utils.toArray<HTMLElement>(".reveal-line").forEach((line) => {
        const words = line.querySelectorAll(".reveal-word");
        const icons = line.querySelectorAll(".reveal-icons > *");
        gsap.set(words, wordsFrom);
        if (icons.length) gsap.set(icons, { autoAlpha: 0, scale: 0.4, y: 6 });

        ScrollTrigger.create({
          trigger: line,
          start: "top 82%",
          once: true,
          onEnter: () => {
            gsap.to(words, {
              ...wordsTo,
              duration: 0.5,
              ease: "power2.out",
              stagger: 0.025,
            });
            if (icons.length)
              gsap.to(icons, {
                autoAlpha: 1,
                scale: 1,
                y: 0,
                duration: 0.5,
                ease: "back.out(1.7)",
                stagger: 0.07,
                delay: 0.18,
              });
          },
        });
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

      // Heights only settle once fonts, images and the smooth-content transform
      // are in place; recompute trigger positions so nothing stays hidden.
      ScrollTrigger.refresh();
    });

    // Route in-page anchor links (nav + CTAs) through the smoother so they
    // glide instead of jumping, and land clear of the sticky top offset.
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = (event.target as HTMLElement)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target || !smoother) return;
      event.preventDefault();
      smoother.scrollTo(target, true, "top 32px");
      history.pushState(null, "", hash);
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      ctx.revert();
      root.classList.remove("gsap-smooth");
    };
  }, []);

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
