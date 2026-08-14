"use client";

import { useState } from "react";

/* Text stays a plain mailto link; the icon beside it copies the address
   instead, with the same check-mark language the waitlist form uses for
   "done" states. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context).
      // The mailto link next to this button still works either way.
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <a
        href={`mailto:${email}`}
        className="inline-flex min-h-[44px] items-center transition-[color] hover:text-ink sm:min-h-0"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Email address copied" : "Copy email address"}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-body/50 transition-[color] hover:text-ink"
      >
        {copied ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="size-4 text-brand-green"
          >
            <path
              d="M4.5 10.5 8 14 15.5 6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
            <rect
              x="7.5"
              y="7.5"
              width="9"
              height="9"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4.5 12.5v-7a2 2 0 0 1 2-2h7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email address copied" : ""}
      </span>
    </span>
  );
}
