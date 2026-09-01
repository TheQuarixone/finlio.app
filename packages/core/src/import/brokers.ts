import type { Asset } from "@finlio/schemas";
import { MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";
import { columnIndex, findHeaderRow, parseCsv, parseNumber } from "./csv";

/**
 * Broker holdings imports (PRD ON-4).
 *
 * Everything here is pure: text in, assets out. That is what lets the import run
 * entirely in the browser — the file never reaches a server (ADR-0004), and the
 * whole pipeline is testable against fixtures with no network.
 *
 * Column *aliases* rather than fixed positions, because brokers reorder and
 * rename columns between exports without telling anyone, and a positional parser
 * silently reads the wrong field when they do.
 */

export interface ImportedRow {
  asset: Asset;
  /** The source line, so the preview can show what a row came from. */
  source: string;
}

export interface ImportResult {
  rows: ImportedRow[];
  /** Rows we could not read, with why. Surfaced, never silently dropped. */
  skipped: { line: number; reason: string; source: string }[];
}

export type BrokerId = "zerodha" | "groww";

const inr = (major: number) => ({
  minor: Math.round(major * MINOR_UNITS_PER_MAJOR),
  currency: "INR" as const,
});

interface BrokerSpec {
  id: BrokerId;
  label: string;
  /** Columns that must all be present for a row to be this broker's format. */
  required: string[];
  aliases: Record<string, string[]>;
}

/**
 * Zerodha Console → Holdings export. Quantity and average cost are the two
 * fields that matter; the rest of the export is P&L we recompute ourselves.
 */
const ZERODHA: BrokerSpec = {
  id: "zerodha",
  label: "Zerodha",
  required: ["Symbol", "Quantity"],
  aliases: {
    symbol: ["Symbol", "Instrument", "Tradingsymbol"],
    quantity: ["Quantity", "Qty", "Quantity Available"],
    average: ["Average Price", "Avg. cost", "Average Cost", "Buy Average"],
    isin: ["ISIN"],
  },
};

/** Groww → Holdings export. Similar shape, different column names. */
const GROWW: BrokerSpec = {
  id: "groww",
  label: "Groww",
  required: ["Stock Name", "Quantity"],
  aliases: {
    symbol: ["Symbol", "Stock Name", "Company Name", "Scrip"],
    quantity: ["Quantity", "Qty", "Shares"],
    average: ["Average Price", "Avg Buy Price", "Buy Average", "Average buy price"],
    isin: ["ISIN"],
  },
};

const SPECS: Record<BrokerId, BrokerSpec> = { zerodha: ZERODHA, groww: GROWW };

/**
 * Work out which broker produced a file, so the user doesn't have to tell us.
 * Returns null when nothing matches — better than guessing and mis-parsing.
 */
export function detectBroker(csv: string): BrokerId | null {
  const rows = parseCsv(csv);
  for (const spec of Object.values(SPECS)) {
    if (findHeaderRow(rows, spec.required) !== -1) return spec.id;
  }
  return null;
}

export interface ParseOptions {
  /** Injected so imported rows have a deterministic timestamp in tests. */
  now: Date;
  /** Supplies ids; injected for the same reason. */
  makeId: () => string;
}

export function parseHoldings(
  csv: string,
  broker: BrokerId,
  { now, makeId }: ParseOptions
): ImportResult {
  const spec = SPECS[broker];
  const rows = parseCsv(csv);
  const headerAt = findHeaderRow(rows, spec.required);

  if (headerAt === -1) {
    return {
      rows: [],
      skipped: [
        {
          line: 0,
          reason: `This doesn't look like a ${spec.label} holdings export — expected columns ${spec.required.join(" and ")}.`,
          source: rows[0]?.join(",") ?? "",
        },
      ],
    };
  }

  const index = columnIndex(rows[headerAt]!, spec.aliases);
  const result: ImportResult = { rows: [], skipped: [] };
  const updatedAt = now.toISOString();

  for (let i = headerAt + 1; i < rows.length; i += 1) {
    const row = rows[i]!;
    const source = row.join(",");
    const cell = (key: string) => {
      const at = index[key];
      return at === undefined || at < 0 ? undefined : row[at]?.trim();
    };

    const symbol = cell("symbol");
    const quantity = parseNumber(cell("quantity"));
    const average = parseNumber(cell("average"));

    if (!symbol) {
      // Totals rows and footers land here. Common enough not to be alarming,
      // but still reported rather than swallowed.
      result.skipped.push({ line: i + 1, reason: "No instrument name in this row.", source });
      continue;
    }
    if (quantity === null || quantity <= 0) {
      result.skipped.push({ line: i + 1, reason: `No usable quantity for ${symbol}.`, source });
      continue;
    }

    // A holding with no cost basis is still a holding — the user can price it
    // later. Dropping it would silently understate their net worth.
    const avgPrice = inr(average ?? 0);

    result.rows.push({
      source,
      asset: {
        id: makeId(),
        label: symbol,
        updatedAt,
        kind: "equity",
        ticker: symbol.toUpperCase(),
        exchange: "NSE",
        qty: Math.round(quantity),
        avgPrice,
      },
    });
  }

  return result;
}

/**
 * Merge imported holdings into what the user already has.
 *
 * Re-importing an export is the normal case, not an edge case — people do it
 * monthly. Matching on ticker means a second import updates the position rather
 * than creating a duplicate that quietly doubles their net worth.
 */
export interface MergePlan {
  added: Asset[];
  updated: { existing: Asset; incoming: Asset }[];
  unchanged: Asset[];
}

export function planMerge(existing: readonly Asset[], incoming: readonly Asset[]): MergePlan {
  const byTicker = new Map(
    existing
      .filter((asset): asset is Extract<Asset, { kind: "equity" }> => asset.kind === "equity")
      .map((asset) => [asset.ticker.toUpperCase(), asset])
  );

  const plan: MergePlan = { added: [], updated: [], unchanged: [] };

  for (const asset of incoming) {
    if (asset.kind !== "equity") {
      plan.added.push(asset);
      continue;
    }
    const match = byTicker.get(asset.ticker.toUpperCase());
    if (!match) {
      plan.added.push(asset);
    } else if (match.qty === asset.qty && match.avgPrice.minor === asset.avgPrice.minor) {
      plan.unchanged.push(match);
    } else {
      plan.updated.push({ existing: match, incoming: asset });
    }
  }

  return plan;
}

/** Apply a plan, preserving the id of anything already stored. */
export function applyMerge(existing: readonly Asset[], plan: MergePlan): Asset[] {
  const replacements = new Map(
    plan.updated.map(({ existing: was, incoming }) => [was.id, { ...incoming, id: was.id }])
  );
  return [
    ...existing.map((asset) => replacements.get(asset.id) ?? asset),
    ...plan.added,
  ];
}

export const BROKER_LABELS: Record<BrokerId, string> = {
  zerodha: "Zerodha",
  groww: "Groww",
};
