"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  parseConsent,
  subscribeConsent,
} from "@/lib/consent";
import { resumeAnalytics, startAnalytics, stopAnalytics } from "@/lib/analytics";

/* Starts and stops PostHog in step with the consent cookie.

   Consent is read through `useSyncExternalStore` rather than an effect, so
   there is no cookie state duplicated into React and no hydration flip: the
   server snapshot is "not yet asked", the client snapshot is the real cookie.

   The effect only performs the side effect (boot / opt out / opt back in); it
   never writes React state, which is what the compiler lint objects to. */

export function Analytics() {
  const cookie = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const allowed = parseConsent(cookie)?.analytics === true;

  useEffect(() => {
    if (allowed) {
      startAnalytics();
      // Covers withdraw → grant in the same session, where PostHog is already
      // initialised but opted out.
      resumeAnalytics();
    } else {
      stopAnalytics();
    }
  }, [allowed]);

  return null;
}
