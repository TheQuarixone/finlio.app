"use client";

import { useEffect, useRef } from "react";
import { LogoMark } from "@/components/logo";
import { buttonPrimary } from "@/lib/ui";

/* Confirmation moment after a waitlist signup.

   Built on the native <dialog> element via showModal(), which gives us a real
   focus trap, Escape-to-close, inert background and the ::backdrop layer for
   free — no focus-management library, no scroll-lock hacks. Everything is
   opt-out under prefers-reduced-motion. */

export function WaitlistSuccessModal({
  open,
  email,
  isNew,
  position,
  onClose,
}: {
  open: boolean;
  email: string | null;
  /** false when they were already on the list — the copy changes. */
  isNew: boolean;
  /** Their place in line, if we have a count. */
  position: number | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="waitlist-success-title"
      className="waitlist-dialog m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-ink ring-1 ring-line backdrop:bg-ink/25 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-8 sm:pt-10">
        {/* Tick, drawn on rather than popped in. */}
        <span className="relative flex size-16 items-center justify-center rounded-full bg-brand-green/10">
          <span className="waitlist-dialog-ring absolute inset-0 rounded-full ring-1 ring-brand-green/30" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="size-8 text-brand-green"
          >
            <path
              d="M5 12.5 10 17.5 19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="waitlist-dialog-tick"
            />
          </svg>
        </span>

        <h2
          id="waitlist-success-title"
          className="mt-5 text-[1.75rem] font-medium leading-[1.1] tracking-[-0.03em] [text-wrap:balance] sm:text-[2rem]"
        >
          {isNew ? "You’re on the list." : "You’re already on the list."}
        </h2>

        <p className="mt-3 text-[15px] leading-[1.55] tracking-[-0.011em] text-body [text-wrap:pretty] sm:text-base">
          {isNew ? "We sent a confirmation to " : "We already have "}
          {email ? (
            <span className="font-medium text-ink">{email}</span>
          ) : (
            "your inbox"
          )}
          .
        </p>

        {position !== null && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-[14px] font-medium ring-1 ring-line">
            <span className="size-2 rounded-full bg-brand-green" />
            <span>
              {`You’re #${position.toLocaleString("en-IN")} in line`}
            </span>
          </p>
        )}

        <div className="mt-7 w-full rounded-2xl bg-cream p-5 text-left ring-1 ring-line">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-body/60">
            <LogoMark className="size-4" />
            What happens next
          </p>
          <ul className="mt-3 space-y-2.5 text-[14px] leading-[1.5] text-body">
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-blue" />
              We’ll email you the day Finlio opens.
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-amber" />
              You’ll get your first morning message before the market opens.
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-green" />
              Early members get the paid plan free for the first few months.
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className={`mt-6 h-12 w-full text-[16px] ${buttonPrimary}`}
        >
          Got it
        </button>
      </div>
    </dialog>
  );
}
