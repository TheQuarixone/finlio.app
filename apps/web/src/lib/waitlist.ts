import { assertResendConfigured, resend } from "@/lib/resend";

/**
 * Waitlist storage. For now signups are kept as Resend **contacts**
 * (workspace-level, no audience needed) — the serverless filesystem is
 * read-only outside /tmp and /tmp doesn't persist, so a local file can't be
 * trusted in production.
 *
 * Phase 1 replaces this with a Supabase `subscribers` table via Drizzle
 * (see docs/phase-1.md §3). Keep this module the single storage seam so that
 * swap is contained.
 */

// Display seed so the counter doesn't start at zero pre-launch.
const SEED_COUNT = 1_284;

export async function getWaitlistCount(): Promise<number> {
  const { data } = await resend.contacts.list();
  return SEED_COUNT + (data?.data.length ?? 0);
}

export async function addToWaitlist(
  email: string
): Promise<{ added: boolean; count: number }> {
  assertResendConfigured();

  const normalized = email.trim().toLowerCase();

  const { data: existing, error: lookupError } = await resend.contacts.get({
    email: normalized,
  });

  if (lookupError && lookupError.name !== "not_found") {
    throw new Error(lookupError.message);
  }

  if (existing) {
    return { added: false, count: await getWaitlistCount() };
  }

  const { error } = await resend.contacts.create({ email: normalized });

  if (error) {
    throw new Error(error.message);
  }

  return { added: true, count: await getWaitlistCount() };
}
