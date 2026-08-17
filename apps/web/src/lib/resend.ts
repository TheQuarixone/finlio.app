import { Resend } from "resend";

/**
 * Single shared Resend client. Import this everywhere instead of constructing
 * `new Resend(...)` per module. The key is read lazily so importing this file
 * never throws at build time; callers that actually send assert the key first
 * (see `assertResendConfigured`).
 */
export const resend = new Resend(process.env.RESEND_API_KEY);

/** Default sender. Override via `RESEND_FROM_EMAIL` (a verified domain sender). */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Finlio <onboarding@resend.dev>";

export function assertResendConfigured(): void {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
}
