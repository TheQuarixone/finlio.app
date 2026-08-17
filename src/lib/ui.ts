/* Shared surface treatments.

   Buttons follow a soft-depth pill language (à la cap.so): a fully-rounded pill
   with a subtle top-edge highlight and a soft ambient shadow that lifts a touch
   on hover, then presses in on click. Colour still does the heavy lifting; the
   elevation is quiet, never glassy or heavy. */

export const buttonPrimary = [
  "inline-flex items-center justify-center rounded-full font-medium text-white",
  // Solid dark base with a faint top-lit gradient for the glossy pill look.
  "bg-btn bg-gradient-to-b from-white/[0.16] to-white/0",
  "shadow-[var(--shadow-btn)]",
  // Lift + deepen + a touch of sheen on hover; snap back down on press.
  "transition-[transform,box-shadow,filter] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
  "hover:-translate-y-[2px] hover:shadow-[var(--shadow-btn-hover)] hover:brightness-[1.14]",
  "active:translate-y-0 active:scale-[0.97] active:brightness-100 active:duration-100",
  "disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:brightness-100",
].join(" ");

/* The quieter companion button: flat white pill, dark text, hairline ring. */
export const buttonSecondary = [
  "inline-flex items-center justify-center rounded-full bg-white font-medium text-jet",
  "ring-1 ring-line",
  "transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
  "hover:bg-cream active:scale-[0.97]",
].join(" ");

/* App icons keep only a hairline edge so pale glyphs stay defined against the
   cream panel — no shadow. */
export const appIcon =
  "rounded-[23%] outline outline-1 -outline-offset-1 outline-black/10";
