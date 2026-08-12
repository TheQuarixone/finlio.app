"use client";

import { useEffect, useState } from "react";

/* Words are deliberately close in length. The box sizes itself to the widest
   one and then never changes, so nothing can overflow it mid-transition and
   the rest of the headline never shifts. Each word carries its own accent,
   so the headline cycles through the palette used elsewhere on the page. */
const WORDS = [
  { text: "moved", color: "var(--color-brand-blue)" },
  { text: "jumped", color: "var(--color-brand-green)" },
  { text: "dropped", color: "var(--color-brand-orange)" },
  { text: "climbed", color: "var(--color-brand-purple)" },
];

const CORNERS = [
  "-top-1 -left-1",
  "-top-1 -right-1",
  "-bottom-1 -left-1",
  "-bottom-1 -right-1",
] as const;

export function RotatingWord() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActive((current) => (current + 1) % WORDS.length),
      2400
    );
    return () => clearInterval(timer);
  }, []);

  const accent = WORDS[active].color;

  return (
    <span className="relative mx-0.5 inline-grid max-w-full -rotate-2 px-2 italic sm:mx-1 sm:px-3">
      {/* The frame is an overlay rather than a border on the box itself, so it
          cannot change the box's content width. */}
      <span
        aria-hidden="true"
        style={{
          borderColor: accent,
          backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)`,
        }}
        className="absolute inset-0 rounded-[6px] border-[1.5px] transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:border-2"
      />
      {CORNERS.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          style={{ borderColor: accent }}
          className={`absolute ${corner} size-1.5 rounded-[2px] border-[1.5px] bg-white transition-[border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:size-2 sm:border-2`}
        />
      ))}
      {WORDS.map((word, index) => (
        <span
          key={word.text}
          aria-hidden={index !== active}
          style={{ color: word.color }}
          className={`col-start-1 row-start-1 justify-self-center transition-[opacity,filter,translate] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            index === active
              ? "opacity-100 blur-0 translate-y-0"
              : "opacity-0 blur-[4px] translate-y-1"
          }`}
        >
          {word.text}
        </span>
      ))}
    </span>
  );
}
