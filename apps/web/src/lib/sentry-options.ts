import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";
import type { ScrubbableEvent } from "@finlio/core/observability";
import { scrubEvent } from "@finlio/core/observability";

/**
 * Shared Sentry configuration.
 *
 * The important line is `beforeSend`. Every event passes through the scrubber in
 * `packages/core` before it leaves the process — a holding that reaches Sentry
 * has left the device (ADR-0004), and once it is in a third party's store it is
 * not coming back.
 *
 * Sentry is only initialised when a DSN is set, so local development and CI
 * never emit anything.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Sampled: errors matter, traces are a cost. Raise deliberately.
  tracesSampleRate: 0.1,

  // Never record sessions. Replay on a finance dashboard would capture the
  // exact numbers this whole architecture exists to keep off our servers.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  sendDefaultPii: false,

  // The scrubber is structural, so it preserves Sentry's own event shape.
  beforeSend(event: ErrorEvent): ErrorEvent {
    return scrubEvent(event as ScrubbableEvent) as ErrorEvent;
  },

  beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
    const [scrubbed] = scrubEvent({ breadcrumbs: [breadcrumb] }).breadcrumbs ?? [];
    return { ...breadcrumb, ...scrubbed };
  },
};
