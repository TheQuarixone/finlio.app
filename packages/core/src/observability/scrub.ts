/**
 * Redaction for anything leaving the app as telemetry.
 *
 * A finance app leaking balances into an error tracker is the worst bug this
 * codebase can produce: it is silent, it is retroactive (the data sits in a
 * third party's store), and it breaks the one promise the product is built on
 * (ADR-0004 — a holding that reaches Sentry has left the device).
 *
 * So this is deny-by-default. Rather than hunting for known-bad fields, any key
 * that looks financial or identifying is replaced wholesale, and free text is
 * swept for currency amounts and long digit runs. Over-redaction costs a little
 * debugging convenience; under-redaction costs the product's credibility.
 *
 * Lives in `packages/core` so web and React Native scrub identically.
 */

const REDACTED = "[redacted]";

/** Key names whose *values* never leave, whatever they contain. */
const SENSITIVE_KEY = new RegExp(
  [
    "minor", "amount", "balance", "value", "price", "nav", "principal", "cover",
    "premium", "outstanding", "emi", "target", "income", "expense", "networth",
    "net_worth", "salary", "qty", "quantity", "units", "grams",
    "markdown", "document", "holding", "asset", "liability", "portfolio",
    "email", "phone", "pan", "aadhaar", "account", "folio", "isin",
    "token", "secret", "password", "apikey", "api_key", "authorization", "cookie",
  ].join("|"),
  "i"
);

/** Currency amounts and long digit runs in free text. */
const AMOUNT = /(?:₹|rs\.?|inr|\$)\s?[\d,]+(?:\.\d+)?/gi;
const LONG_NUMBER = /\b\d[\d,]{3,}(?:\.\d+)?\b/g;
const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g;

export function scrubText(input: string): string {
  return input
    .replace(EMAIL, REDACTED)
    .replace(AMOUNT, REDACTED)
    .replace(LONG_NUMBER, REDACTED);
}

/**
 * Recursively redact a structure. Depth-limited because error payloads can be
 * cyclic or enormous, and a telemetry hook must never be the thing that hangs.
 */
export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return REDACTED;
  if (value == null) return value;

  if (typeof value === "string") return scrubText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => scrubValue(item, depth + 1));

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(nested, depth + 1);
    }
    return out;
  }

  return REDACTED;
}

export interface ScrubbableEvent {
  message?: string;
  exception?: { values?: { value?: string; type?: string }[] };
  request?: { url?: string; headers?: Record<string, string>; data?: unknown };
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: { message?: string; data?: unknown }[];
  user?: Record<string, unknown>;
}

/**
 * Scrub a Sentry-shaped event. Kept provider-agnostic and pure so it is
 * testable without booting an SDK.
 *
 * `user` is reduced to an id: knowing *which* account hit an error is worth
 * keeping, knowing their email is not.
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  const scrubbed = { ...event } as ScrubbableEvent;

  if (scrubbed.message) scrubbed.message = scrubText(scrubbed.message);

  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      values: scrubbed.exception.values.map((entry) => ({
        ...entry,
        ...(entry.value ? { value: scrubText(entry.value) } : {}),
      })),
    };
  }

  if (scrubbed.request) {
    scrubbed.request = {
      ...scrubbed.request,
      // Query strings are a classic accidental leak path.
      ...(scrubbed.request.url ? { url: scrubbed.request.url.split("?")[0] } : {}),
      ...(scrubbed.request.headers ? { headers: scrubValue(scrubbed.request.headers) as Record<string, string> } : {}),
      ...(scrubbed.request.data !== undefined ? { data: scrubValue(scrubbed.request.data) } : {}),
    };
  }

  if (scrubbed.extra) scrubbed.extra = scrubValue(scrubbed.extra) as Record<string, unknown>;
  if (scrubbed.contexts) scrubbed.contexts = scrubValue(scrubbed.contexts) as Record<string, unknown>;

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map((crumb) => ({
      ...crumb,
      ...(crumb.message ? { message: scrubText(crumb.message) } : {}),
      ...(crumb.data !== undefined ? { data: scrubValue(crumb.data) } : {}),
    }));
  }

  if (scrubbed.user) {
    scrubbed.user = scrubbed.user.id ? { id: scrubbed.user.id } : {};
  }

  return scrubbed as T;
}
