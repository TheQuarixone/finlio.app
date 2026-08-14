"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";
import { buttonPrimary } from "@/lib/ui";

const initialState: WaitlistState = {
  status: "idle",
  message: "",
  count: null,
};

const inputShell =
  "flex h-12 w-full items-center rounded-[1.25rem] bg-white px-4 shadow-[0_1px_2px_rgba(18,18,18,0.06),0_12px_28px_rgba(18,18,18,0.08)] ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-blue/40 sm:h-14 sm:flex-1 sm:rounded-full sm:bg-cream sm:px-5 sm:shadow-none";

const successShell =
  "flex min-h-14 w-full max-w-xl items-center justify-center gap-2.5 rounded-[1.25rem] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(18,18,18,0.06),0_12px_28px_rgba(18,18,18,0.08)] ring-1 ring-line sm:rounded-full sm:px-6 sm:py-0";

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialState
  );

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3 px-1 sm:gap-2.5">
      {state.status === "success" ? (
        <div className={successShell}>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="size-5 shrink-0 text-brand-green"
          >
            <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
            <path
              d="M6 10.5 L9 13.5 L14.5 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-center text-[15px] font-medium text-ink sm:text-base">
            {state.message}
          </p>
        </div>
      ) : (
        <form
          action={formAction}
          className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2.5"
        >
          <div className={inputShell}>
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <input
              id="waitlist-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="Enter your email"
              className="h-full w-full min-w-0 bg-transparent text-base text-ink placeholder:text-body/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className={`h-12 w-full shrink-0 px-5 text-[15px] sm:h-14 sm:w-auto sm:min-w-[8.75rem] ${buttonPrimary}`}
          >
            {isPending ? "Joining…" : "Join Waitlist"}
          </button>
        </form>
      )}

      {state.status === "error" && (
        <p role="alert" className="px-2 text-center text-sm font-medium text-brand-red">
          {state.message}
        </p>
      )}

      {/* Social-proof counter hidden pre-launch. To bring it back, render
          state.count ?? getWaitlistCount() here (see src/lib/waitlist.ts). */}
    </div>
  );
}
