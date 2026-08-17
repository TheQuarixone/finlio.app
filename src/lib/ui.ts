/* Shared surface treatments.

   Finlio's marketing surfaces are flat: definition comes from a warm off-white
   ground, hairline rings/outlines, and colour — never drop shadows. Buttons are
   solid pills that respond with colour and a small press-scale rather than
   elevation. */

export const buttonPrimary = [
  "inline-flex items-center justify-center rounded-full bg-btn font-medium text-white",
  "transition-[scale,background-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
  "hover:bg-jet active:scale-[0.96] disabled:opacity-70",
].join(" ");

/* The quieter companion button: warm off-white, dark text, same pill. */
export const buttonSecondary = [
  "inline-flex items-center justify-center rounded-full bg-sand font-medium text-jet",
  "ring-1 ring-line/80",
  "transition-[scale,background-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
  "hover:bg-line/60 active:scale-[0.96]",
].join(" ");

/* App icons keep only a hairline edge so pale glyphs stay defined against the
   cream panel — no shadow. */
export const appIcon =
  "rounded-[23%] outline outline-1 -outline-offset-1 outline-black/10";
