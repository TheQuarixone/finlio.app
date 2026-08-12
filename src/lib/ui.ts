/* Shared surface treatments, adapted from family.co.

   Both the dark buttons and the app icons use the same idea: a hairline rim,
   a highlight along the top edge, and a two-part shadow (one tight contact
   shadow plus one soft ambient one). That is what makes them read as raised
   objects sitting on the page rather than flat fills. */

const raised =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_0_1px_rgba(255,255,255,0.09),0_1px_2px_rgba(18,18,18,0.28),0_8px_20px_rgba(18,18,18,0.16)]";

const raisedHover =
  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.12),0_1px_2px_rgba(18,18,18,0.3),0_12px_28px_rgba(18,18,18,0.22)]";

export const buttonPrimary = [
  "inline-flex items-center justify-center rounded-full bg-btn font-medium text-white",
  raised,
  raisedHover,
  "transition-[scale,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
  "hover:bg-jet active:scale-[0.96] disabled:opacity-70",
].join(" ");

/* The quieter companion button, as family.co pairs "Log In" with
   "Get Started": warm off-white, dark text, same pill. */
export const buttonSecondary = [
  "inline-flex items-center justify-center rounded-full bg-sand font-medium text-jet",
  "ring-1 ring-line/80",
  "transition-[scale,background-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
  "hover:bg-line/60 active:scale-[0.96]",
].join(" ");

/* Same language on the app icons: a hairline edge so pale icons stay defined
   against the cream panel, plus the same two-part shadow. */
export const appIcon = [
  "rounded-[23%] outline outline-1 -outline-offset-1 outline-black/10",
  "shadow-[0_1px_2px_rgba(18,18,18,0.16),0_6px_14px_rgba(18,18,18,0.12)]",
].join(" ");
