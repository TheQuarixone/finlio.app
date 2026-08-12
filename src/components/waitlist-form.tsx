"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";
import { buttonPrimary } from "@/lib/ui";

const initialState: WaitlistState = {
  status: "idle",
  message: "",
  count: null,
};

const shell =
  "w-full max-w-[22rem] rounded-[1.25rem] bg-white p-2 shadow-[0_1px_2px_rgba(18,18,18,0.06),0_12px_28px_rgba(18,18,18,0.08)] ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-blue/40 sm:max-w-xl sm:rounded-full sm:bg-cream sm:p-1.5 sm:pl-5 sm:shadow-none";

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialState
  );

  return (
    <div className="flex w-full flex-col items-center gap-3 px-1 sm:gap-4">
      {state.status === "success" ? (
        <div
          className={`${shell} flex min-h-14 items-center justify-center gap-2.5 px-4 py-3 sm:min-h-14 sm:px-6 sm:py-0`}
        >
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
          className={`${shell} flex flex-col gap-2 sm:h-14 sm:flex-row sm:items-center sm:gap-1.5`}
        >
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
            className="h-12 w-full min-w-0 flex-1 rounded-xl bg-transparent px-4 text-base text-ink placeholder:text-body/50 focus:outline-none sm:h-full sm:rounded-none sm:px-1"
          />
          <button
            type="submit"
            disabled={isPending}
            className={`h-12 w-full shrink-0 px-5 text-[15px] sm:h-11 sm:w-auto sm:min-w-[8.75rem] sm:px-5 sm:text-[15px] ${buttonPrimary}`}
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
