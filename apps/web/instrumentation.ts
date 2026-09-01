import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

/**
 * Server and edge error reporting. Next calls `register()` once per runtime.
 * No DSN means no initialisation, so local and CI stay silent.
 */
export async function register() {
  if (!sentryOptions.enabled) return;
  Sentry.init(sentryOptions);
}

export const onRequestError = Sentry.captureRequestError;
