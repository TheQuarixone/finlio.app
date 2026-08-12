"use server";

import { addToWaitlist } from "@/lib/waitlist";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message: string;
  count: number | null;
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
    };
  }

  try {
    const { added, count } = await addToWaitlist(email);
    return {
      status: "success",
      message: added
        ? "Done. We will email you when Finlio is ready."
        : "You are already on the list. We will email you soon.",
      count,
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
      count: null,
    };
  }
}
