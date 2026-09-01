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

/* Local development is not a user journey. Sending it to PostHog inflates
   pageviews, pollutes the waitlist funnel with our own submits, and creates
   person records for developers. Checked on hostname rather than NODE_ENV
   because `next build && next start` runs a production build on localhost. */
function isLocalHost(): boolean {
  const { hostname } = window.location;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

/** Boots PostHog if it is configured, consented to, and not already running. */
export function startAnalytics(): void {
  if (started || !isAnalyticsConfigured() || !hasConsent("analytics")) return;
  if (typeof window === "undefined") return;
  if (isLocalHost()) return;

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

  /* The signed-in funnel (phase-2 OBS-3): sign up → add a holding → see a net
     worth. These three answer the only question that matters this phase — does
     a new account reach a number that means something to them.

     Properties are counts and categories, never amounts. A holding's value is
     exactly what must not leave the device (ADR-0004), and analytics is a
     leak path like any other. */
  signupCompleted: "signup_completed",
  assetAdded: "asset_added",
  networthViewed: "networth_viewed",
  csvImported: "csv_imported",
  goalCreated: "goal_created",
} as const;
