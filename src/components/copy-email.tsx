"use client";

import { useState } from "react";

/* One button: the address plus a copy icon. Clicking copies the address and
   the whole control animates to a "Copied!" state. The icon stays in normal
   flow (always the rightmost element), and "Copied!" is right-aligned inside
   the text box so it tucks up against the icon — no dependency on the button's
   own width, so the tick and label never drift apart. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context).
    }
  }

  const fade = "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Email address copied" : `Copy ${email}`}
      className="group -mx-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-body/50 outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-orange/40 sm:text-[14px]"
    >
      {/* Text box: width is fixed by the email; "Copied!" overlays it,
          right-aligned so it ends exactly where the email ends. */}
      <span className="relative inline-block text-right">
        <span
          className={`inline-block ${fade} ${
            copied ? "-translate-y-0.5 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {email}
        </span>
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 right-0 flex items-center justify-end font-medium text-brand-green ${fade} ${
            copied ? "translate-y-0 opacity-100" : "translate-y-0.5 opacity-0"
          }`}
        >
          Copied!
        </span>
      </span>

      {/* Icon box: stays put; copy crossfades to check in place. */}
      <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`absolute size-4 ${fade} ${
            copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
          }`}
        >
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
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`absolute size-4 text-brand-green ${fade} ${
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <path
            d="M4.5 10.5 8 14 15.5 6.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email address copied" : ""}
      </span>
    </button>
  );
}
