import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Finlio <onboarding@resend.dev>";

export async function sendWaitlistConfirmation(email: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're on the Finlio waitlist",
    html: `
      <p>Thanks for joining the Finlio waitlist.</p>
      <p>We will email you when the app is ready. Every market morning, Finlio will send you one short message explaining why the stocks and mutual funds you own may go up or down that day — in plain English, not share market language.</p>
      <p>— The Finlio team</p>
    `.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
