import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { is } from "drizzle-orm";
import * as schema from "./schema";

/**
 * RLS is the last line between PostgREST and somebody else's finances, and it
 * is easy to forget on a new table — the table simply works, because
 * server-side code connects directly and bypasses RLS entirely. Nothing fails
 * until the day an anon key reads the whole table.
 *
 * So it is asserted rather than remembered.
 */

// The barrel also exports enums, so the values are widened to `unknown` before
// narrowing — a predicate cannot narrow across the union of concrete table types.
const tables = (Object.values(schema) as unknown[]).filter((value): value is PgTable =>
  is(value, PgTable)
);

const migrationSql = readdirSync(join(import.meta.dirname, "../../drizzle"))
  .filter((file) => file.endsWith(".sql"))
  .map((file) => readFileSync(join(import.meta.dirname, "../../drizzle", file), "utf8"))
  .join("\n");

describe("row level security", () => {
  it("finds every table in the schema", () => {
    const names = tables.map((t) => getTableConfig(t).name).sort();
    expect(names).toEqual([
      "brief_logs", "goals", "profiles", "snapshots", "subscribers", "subscriptions",
    ]);
  });

  it.each(tables.map((t) => [getTableConfig(t).name, t] as const))(
    "%s has RLS enabled in the schema",
    (_name, table) => {
      expect(getTableConfig(table).enableRLS).toBe(true);
    }
  );

  it.each(tables.map((t) => getTableConfig(t).name))(
    "%s has ENABLE ROW LEVEL SECURITY in a migration",
    (name) => {
      expect(migrationSql).toContain(`"${name}" ENABLE ROW LEVEL SECURITY`);
    }
  );

  /**
   * `subscribers` is the deliberate exception: RLS on with *no* policy, so
   * anon and authenticated get no access at all. Every write is server-side,
   * which is stricter than an insert-only policy — nothing can scrape the
   * waitlist through the public API.
   */
  it.each(["profiles", "goals", "snapshots", "subscriptions", "brief_logs"])(
    "%s has an owner-scoped policy",
    (name) => {
      const policy = new RegExp(`CREATE POLICY[\\s\\S]{0,80}ON "${name}"[\\s\\S]{0,300}?auth\\.uid\\(\\)`);
      expect(migrationSql).toMatch(policy);
    }
  );

  it("never grants a user write access to their own subscription tier", () => {
    // An entitlement a user can write is not an entitlement.
    expect(migrationSql).toContain('"subscriptions_owner_read" ON "subscriptions"');
    expect(migrationSql).not.toMatch(/CREATE POLICY[^\n]*ON "subscriptions"\s+FOR ALL/);
  });
});
