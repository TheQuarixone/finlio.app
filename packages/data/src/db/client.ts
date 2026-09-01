import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Shared Drizzle client (postgres.js driver). The connection is created lazily
 * and reused across HMR reloads / serverless invocations so we don't open a new
 * pool per request. postgres.js only dials on the first query, so importing
 * this module never connects at build time.
 */

const globalForDb = globalThis as unknown as {
  __finlioPgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__finlioPgClient ??
  postgres(process.env.DATABASE_URL ?? "", { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__finlioPgClient = client;
}

export const db = drizzle(client, { schema });

/** The typed Drizzle client, so repositories can take it as a dependency. */
export type Db = typeof db;
