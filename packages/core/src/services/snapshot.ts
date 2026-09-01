import type { MonthlySnapshot } from "@finlio/schemas";
import type { ServiceContext } from "./context";

export async function listSnapshots(
  ctx: ServiceContext,
  limit?: number
): Promise<MonthlySnapshot[]> {
  return ctx.snapshots.list(ctx.userId, limit);
}

/**
 * Record a month-end aggregate.
 *
 * Only totals cross the wire — never the holdings behind them (ADR-0004). The
 * client computes the aggregate on-device and sends the result.
 */
export async function recordSnapshot(
  ctx: ServiceContext,
  snapshot: MonthlySnapshot
): Promise<MonthlySnapshot> {
  return ctx.snapshots.put(ctx.userId, snapshot);
}
