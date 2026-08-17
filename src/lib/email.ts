import { WaitlistConfirmationEmail } from "@emails/waitlist-confirmation";
import { assertResendConfigured, FROM_EMAIL, resend } from "@/lib/resend";

/**
 * Transactional email senders. Templates live in `emails/` (react-email) and
 * are passed to Resend via the `react` field — Resend renders them to HTML +
 * plain text, so there is no hand-written markup here.
 */

export async function sendWaitlistConfirmation(email: string): Promise<void> {
  assertResendConfigured();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You're on the Finlio waitlist",
    react: WaitlistConfirmationEmail(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
