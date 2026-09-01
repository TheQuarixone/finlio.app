import { desc, eq } from "drizzle-orm";
import type { CurrencyCode, MonthlySnapshot } from "@finlio/schemas";
import type { SnapshotRepository } from "@finlio/core/ports";
import type { Db } from "../db/client";
import { snapshots, type SnapshotRow } from "../db/product";

function toSnapshot(row: SnapshotRow): MonthlySnapshot {
  const currency = row.currency as CurrencyCode;
  return {
    month: row.month,
    netWorth: { minor: row.netWorthMinor, currency },
    totalAssets: { minor: row.totalAssetsMinor, currency },
    totalLiabilities: { minor: row.totalLiabilitiesMinor, currency },
    ...(row.savingsRateE4 != null ? { savingsRateE4: row.savingsRateE4 } : {}),
  };
}

export function createSnapshotRepository(db: Db): SnapshotRepository {
  return {
    async list(userId, limit = 24) {
      const rows = await db
        .select()
        .from(snapshots)
        .where(eq(snapshots.userId, userId))
        .orderBy(desc(snapshots.month))
        .limit(limit);
      return rows.map(toSnapshot);
    },

    async put(userId, snapshot) {
      // Unique on (user, month), so re-running a month updates rather than
      // appending a second row for the same period.
      const [row] = await db
        .insert(snapshots)
        .values({
          userId,
          month: snapshot.month,
          netWorthMinor: snapshot.netWorth.minor,
          totalAssetsMinor: snapshot.totalAssets.minor,
          totalLiabilitiesMinor: snapshot.totalLiabilities.minor,
          currency: snapshot.netWorth.currency,
          savingsRateE4: snapshot.savingsRateE4 ?? null,
        })
        .onConflictDoUpdate({
          target: [snapshots.userId, snapshots.month],
          set: {
            netWorthMinor: snapshot.netWorth.minor,
            totalAssetsMinor: snapshot.totalAssets.minor,
            totalLiabilitiesMinor: snapshot.totalLiabilities.minor,
            savingsRateE4: snapshot.savingsRateE4 ?? null,
          },
        })
        .returning();
      return toSnapshot(row!);
    },
  };
}
