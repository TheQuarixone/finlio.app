import { countSubscribers, insertSubscriber } from "@finlio/data/repositories";
import { getResend, isResendConfigured } from "@/lib/resend";

/**
 * Waitlist storage. Supabase `subscribers` (via Drizzle) is the source of
 * truth; Resend is the optional mailing mirror for the newsletter layer.
 * See docs/adr/0003-subscriber-storage-and-sending.md.
 */

// Display seed so the counter doesn't start at zero pre-launch.
const SEED_COUNT = 1_284;

export async function getWaitlistCount(): Promise<number> {
  return SEED_COUNT + (await countSubscribers());
}

export async function addToWaitlist(
  email: string,
  /** Where the signup came from, for attribution (see `subscribers.source`). */
  source = "landing"
): Promise<{ added: boolean; count: number }> {
  const normalized = email.trim().toLowerCase();

  const added = await insertSubscriber(normalized, source);

  // Best-effort mirror into Resend contacts for the newsletter layer (ADR-0003).
  // The DB is authoritative, so this must never block or fail a signup.
  if (added && isResendConfigured()) {
    try {
      await getResend().contacts.create({ email: normalized });
    } catch (err) {
      console.error("Resend contact mirror failed:", err);
    }
  }

  return { added, count: await getWaitlistCount() };
}
