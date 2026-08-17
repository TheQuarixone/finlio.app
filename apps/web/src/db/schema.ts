import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * The waitlist is stored as `subscribers` — the same list becomes the
 * newsletter later, so it's named for what it is, not the phase it starts in.
 * Supabase (this table, via Drizzle) is the source of truth; Resend is the
 * sending layer. See docs/adr/0003-subscriber-storage-and-sending.md.
 *
 * RLS is enabled with **no public policies**: every write goes through the
 * server (Drizzle over a direct Postgres connection), so PostgREST's `anon` /
 * `authenticated` roles get no access at all — nobody can read or scrape the
 * subscriber list through the public API. Add a policy only if a client ever
 * needs direct table access.
 */

export const subscriberStatus = pgEnum("subscriber_status", [
  "waitlist",
  "subscribed",
  "unsubscribed",
]);

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    status: subscriberStatus("status").notNull().default("waitlist"),
    /** Where the signup came from, e.g. "landing" — for attribution later. */
    source: text("source"),
    /** Referring URL / campaign, when the client sends one. */
    referrer: text("referrer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Sends filter by status ("who is still subscribed?"), which becomes a
  // sequential scan once the list grows. `email` is already indexed by its
  // unique constraint.
  (t) => [index("subscribers_status_idx").on(t.status)]
).enableRLS();

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
