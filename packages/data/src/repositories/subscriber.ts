import { count } from "drizzle-orm";
import { db } from "../db/client";
import { subscribers } from "../db/subscribers";

/**
 * Waitlist storage. Supabase `subscribers` is the source of truth (ADR-0003).
 *
 * Lives here rather than in `apps/web` so the app never imports Drizzle
 * directly — data access is `@finlio/data`'s job, which is also what lets the
 * query be swapped or cached without touching a Server Action.
 */

export async function countSubscribers(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(subscribers);
  return row?.value ?? 0;
}

/** A duplicate email is a no-op (unique constraint) — not a newly added row. */
export async function insertSubscriber(email: string, source: string): Promise<boolean> {
  const inserted = await db
    .insert(subscribers)
    .values({ email, source })
    .onConflictDoNothing({ target: subscribers.email })
    .returning({ id: subscribers.id });
  return inserted.length > 0;
}
