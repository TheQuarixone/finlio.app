"use server";

import { sendWaitlistConfirmation } from "@/lib/email";
import { addToWaitlist } from "@/lib/waitlist";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message: string;
  count: number | null;
  /** The address we just confirmed, so the UI can echo it back. */
  email: string | null;
  /** Distinguishes a fresh signup from an existing subscriber. */
  added: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    return {
      status: "error",
      message: "Please enter a correct email address.",
      count: null,
      email: null,
      added: false,
    };
  }

  const normalized = email.trim().toLowerCase();

  try {
    const { added, count } = await addToWaitlist(normalized);

    if (added) {
      try {
        await sendWaitlistConfirmation(normalized);
      } catch (err) {
        console.error("Waitlist confirmation email failed:", err);
      }
    }

    return {
      status: "success",
      message: added
        ? "Done. We will email you when Finlio is ready."
        : "You are already on the list. We will email you soon.",
      count,
      email: normalized,
      added,
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
      count: null,
      email: null,
      added: false,
    };
  }
}
