/* Cookie consent state.

   Stored in a first-party cookie rather than localStorage for two reasons:
   the server can read it (so a future analytics script is never *sent* to a
   visitor who declined, instead of being sent and then told to stay quiet),
   and it expires on its own, which is what "ask again periodically" means in
   practice.

   Only two categories exist today. Essential is not a choice: it is the
   consent cookie itself plus whatever the host needs to serve the page.
   Analytics is off until the visitor turns it on, which is the rule under both
   the DPDP Rules 2025 (consent must be a clear affirmative action) and the
   GDPR (non-essential categories default to off). */

export const CONSENT_COOKIE = "finlio_consent";

/** Bump when the categories change, which re-asks everyone. */
export const CONSENT_VERSION = 1;

/** Fired on `window` whenever a choice is saved, so listeners can react
    without a reload. Analytics will subscribe to this (see phase-1 ANA-1). */
export const CONSENT_CHANGED_EVENT = "finlio:consent-changed";

/** Fired on `window` to reopen the banner, from the footer link. */
export const CONSENT_OPEN_EVENT = "finlio:consent-open";

/* Six months. Long enough not to nag, short enough that consent stays a
   current answer rather than one given a year and a redesign ago. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

export type ConsentCategory = "essential" | "analytics";

export type Consent = {
  version: number;
  /** ISO timestamp of the choice, so we can show it back and audit it. */
  at: string;
  analytics: boolean;
};

function isConsent(value: unknown): value is Consent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Consent>;
  return (
    candidate.version === CONSENT_VERSION &&
    typeof candidate.at === "string" &&
    typeof candidate.analytics === "boolean"
  );
}

/** Parses a cookie header or `document.cookie` string. Exported for the
    server, which has the header but no `document`. */
export function parseConsent(cookieString: string | undefined): Consent | null {
  if (!cookieString) return null;

  const entry = cookieString
    .split("; ")
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  if (!entry) return null;

  try {
    const parsed: unknown = JSON.parse(
      decodeURIComponent(entry.slice(CONSENT_COOKIE.length + 1))
    );
    // A cookie from an older version is treated as no answer at all.
    return isConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  return parseConsent(document.cookie);
}

export function writeConsent(analytics: boolean): Consent {
  const consent: Consent = {
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
    analytics,
  };

  if (typeof document !== "undefined") {
    const value = encodeURIComponent(JSON.stringify(consent));
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    window.dispatchEvent(
      new CustomEvent<Consent>(CONSENT_CHANGED_EVENT, { detail: consent })
    );
  }

  return consent;
}

/** Essential is always allowed; everything else has to be granted. */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "essential") return true;
  return readConsent()?.analytics === true;
}

/* `useSyncExternalStore` plumbing, so components can read consent without
   writing cookie state into an effect (React 19 / the compiler lint rightly
   objects to that). The snapshot is the raw cookie string: a primitive, so
   React can compare it cheaply, and it changes exactly when a choice is saved. */

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
}

export function getConsentSnapshot(): string {
  return typeof document === "undefined" ? "" : document.cookie;
}

/** The server has no cookie access here, so it renders as "not yet asked". */
export function getServerConsentSnapshot(): string {
  return "";
}
