"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* Odometer-style word roller for the hero headline.

   Each word rolls up and out of a masked line while the next rolls in from
   below, and its accent colour cycles through the page palette. The box has no
   outline — instead its width morphs smoothly to each word, so the words that
   follow it (the trailing full stop) glide rather than jump, and the line never
   reflows. Respects prefers-reduced-motion: no auto-play, just the first word. */

const WORDS = [
  { text: "moved", color: "var(--color-brand-blue)" },
  { text: "jumped", color: "var(--color-brand-green)" },
  { text: "dropped", color: "var(--color-brand-orange)" },
  { text: "climbed", color: "var(--color-brand-purple)" },
];

const INTERVAL = 2400;
const DURATION = 560;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function RotatingWord() {
  const [active, setActive] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Measure each word at the headline's live font size so the container can
  // animate its width. Re-measures when the font loads and on resize (the
  // headline scales with the viewport via a clamp()).
  useIsoLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () =>
      setWidths(
        WORDS.map((w) => {
          el.textContent = w.text;
          return el.getBoundingClientRect().width;
        })
      );
    measure();
    el.textContent = WORDS[0].text;

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready?.then(measure);
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setActive((current) => (current + 1) % WORDS.length),
      INTERVAL
    );
    return () => window.clearInterval(id);
  }, []);

  const n = WORDS.length;
  const width = widths[active];

  return (
    <span
      className="relative inline-flex overflow-hidden align-bottom transition-[width]"
      style={{
        width: width ? `${width}px` : undefined,
        transitionDuration: `${DURATION}ms`,
        transitionTimingFunction: EASE,
      }}
    >
      {/* In-flow but hidden: gives the box its one-line height and its baseline,
          and is the ruler used to measure each word's width. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible whitespace-nowrap"
      >
        {WORDS[0].text}
      </span>

      {WORDS.map((word, i) => {
        const isActive = i === active;
        const isLeaving = i === (active - 1 + n) % n;
        const y = isActive ? "0%" : isLeaving ? "-115%" : "115%";
        return (
          <span
            key={word.text}
            aria-hidden={!isActive}
            style={{
              color: word.color,
              transform: `translateY(${y})`,
              transitionProperty: "transform, opacity",
              transitionDuration: `${DURATION}ms`,
              transitionTimingFunction: EASE,
            }}
            className={`absolute inset-0 flex items-center justify-start whitespace-nowrap ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            {word.text}
          </span>
        );
      })}
    </span>
  );
}
