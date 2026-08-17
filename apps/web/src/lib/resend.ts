import { Resend } from "resend";

/**
 * Shared Resend client, constructed **lazily**.
 *
 * `new Resend()` throws when the API key is missing, so building it at module
 * scope would make merely importing this file fatal wherever the key isn't set
 * (CI builds, local dev without email, a mis-set env in prod). Since Supabase —
 * not Resend — is the source of truth for subscribers (ADR-0003), a missing
 * email config must never be able to fail a signup.
 *
 * Call `getResend()` at the point of use, inside a try/catch or after
 * `isResendConfigured()`.
 */

let client: Resend | undefined;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  // Cached per process; the key doesn't change at runtime.
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** Default sender. Override via `RESEND_FROM_EMAIL` (a verified domain sender). */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Finlio <onboarding@resend.dev>";

export function assertResendConfigured(): void {
  if (!isResendConfigured()) {
    throw new Error("RESEND_API_KEY is not configured");
  }
}
