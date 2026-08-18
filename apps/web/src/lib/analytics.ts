import posthog from "posthog-js";
import { hasConsent } from "@/lib/consent";

/* PostHog, gated on consent.

   Analytics is a non-essential category, so nothing is loaded or captured
   until the visitor turns it on (DPDP Rules 2025 / GDPR: consent is an
   affirmative action, and non-essential defaults to off). That means we do
   not merely `opt_out` a running client — we never call `init` at all until
   consent exists, so no PostHog request is made and no cookie is set.

   Every function here is safe to call at any time: with no keys configured,
   or before consent, they simply do nothing. */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/** Module-level rather than a React ref: init must happen exactly once per
    page load, no matter how many components ask for it. */
let started = false;

export function isAnalyticsConfigured(): boolean {
  return Boolean(KEY && HOST);
}

/** Boots PostHog if it is configured, consented to, and not already running. */
export function startAnalytics(): void {
  if (started || !isAnalyticsConfigured() || !hasConsent("analytics")) return;
  if (typeof window === "undefined") return;

  posthog.init(KEY as string, {
    api_host: HOST,
    // Pins capture behaviour (incl. SPA pageviews + pageleave) to a dated
    // baseline, so a library upgrade can't silently change what we collect.
    defaults: "2026-05-30",
    // No profile for anonymous visitors — a waitlist page has no accounts yet,
    // and it keeps us from creating person records for people who only looked.
    person_profiles: "identified_only",
  });
  started = true;
}

/** Called when consent is withdrawn: stop capturing and drop the cookies. */
export function stopAnalytics(): void {
  if (!started) return;
  posthog.opt_out_capturing();
}

/** Re-enables capture after a withdraw → grant, without a second init. */
export function resumeAnalytics(): void {
  if (!started) return;
  posthog.opt_in_capturing();
}

/** The one way to record an event. No-ops unless analytics is actually live,
    so callers never have to check first. */
export function track(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!started || !hasConsent("analytics")) return;
  posthog.capture(event, properties);
}

/* The waitlist funnel (phase-1 ANA-2). Named here rather than typed inline at
   each call site, so the funnel is defined in one place and typos can't
   silently create a second event. */
export const EVENTS = {
  waitlistSubmitted: "waitlist_submitted",
  waitlistConfirmed: "waitlist_confirmed",
} as const;
