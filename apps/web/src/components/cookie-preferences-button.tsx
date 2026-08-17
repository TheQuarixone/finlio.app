"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/consent";

/* Footer entry point back into the consent banner. Withdrawing consent has to
   be as easy as giving it, which means a permanent link, not a one-time
   banner. */

export function CookiePreferencesButton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className={className}
    >
      Cookie preferences
    </button>
  );
}
