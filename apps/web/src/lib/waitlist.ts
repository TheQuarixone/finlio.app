import { count } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { getResend, isResendConfigured } from "@/lib/resend";

/**
 * Waitlist storage. Supabase `subscribers` (via Drizzle) is the source of
 * truth; Resend is the optional mailing mirror for the newsletter layer.
 * See docs/adr/0003-subscriber-storage-and-sending.md.
 */

// Display seed so the counter doesn't start at zero pre-launch.
const SEED_COUNT = 1_284;

export async function getWaitlistCount(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(subscribers);
  return SEED_COUNT + (row?.value ?? 0);
}

export async function addToWaitlist(
  email: string,
  /** Where the signup came from, for attribution (see `subscribers.source`). */
  source = "landing"
): Promise<{ added: boolean; count: number }> {
  const normalized = email.trim().toLowerCase();

  // Insert; a duplicate email is a no-op (unique constraint) → not newly added.
  const inserted = await db
    .insert(subscribers)
    .values({ email: normalized, source })
    .onConflictDoNothing({ target: subscribers.email })
    .returning({ id: subscribers.id });

  const added = inserted.length > 0;

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
