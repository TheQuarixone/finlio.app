"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";
import { buttonPrimary } from "@/lib/ui";

const initialState: WaitlistState = {
  status: "idle",
  message: "",
  count: null,
};

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialState
  );

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4">
      {state.status === "success" ? (
        <div className="flex h-16 w-full items-center justify-center gap-2.5 rounded-full bg-cream px-6 ring-1 ring-line">
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
          <p className="text-base font-medium text-ink">{state.message}</p>
        </div>
      ) : (
        <form
          action={formAction}
          className="flex h-16 w-full items-center gap-2 rounded-full bg-cream p-2 pl-6 ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-blue/40"
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
            placeholder="Enter your email"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-body/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className={`h-12 shrink-0 px-6 text-base ${buttonPrimary}`}
          >
            {isPending ? "Joining…" : "Join Waitlist"}
          </button>
        </form>
      )}

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-brand-red">
          {state.message}
        </p>
      )}

      {/* Social-proof counter hidden pre-launch. To bring it back, render
          state.count ?? getWaitlistCount() here (see src/lib/waitlist.ts). */}
    </div>
  );
}
