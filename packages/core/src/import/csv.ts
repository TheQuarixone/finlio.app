/**
 * A minimal RFC-4180 CSV reader.
 *
 * Broker exports are not clean. They carry quoted fields containing commas
 * ("Reliance Industries Ltd., Mumbai"), escaped quotes, CRLF line endings from
 * Windows, and preamble rows above the real header. A `split(",")` handles none
 * of that and fails silently — producing a row that parses into a holding with
 * the wrong quantity, which is worse than an error.
 *
 * Kept here rather than pulling a dependency: the format is small, and parsing
 * somebody's portfolio is not where a transitive supply-chain risk belongs.
 */

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  // Strip a UTF-8 BOM — Excel adds one and it corrupts the first header.
  const text = input.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      // Consume CRLF as one break.
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);

  return rows;
}

/** Header matching that survives casing, spacing and punctuation drift. */
export const normaliseHeader = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Find the header row.
 *
 * Brokers put report titles, account names and blank lines above it, so the
 * header is rarely row 0. Scan for the first row containing every required
 * column rather than assuming a position.
 */
export function findHeaderRow(
  rows: readonly string[][],
  required: readonly string[]
): number {
  const wanted = required.map(normaliseHeader);
  for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
    const header = (rows[i] ?? []).map(normaliseHeader);
    if (wanted.every((column) => header.includes(column))) return i;
  }
  return -1;
}

/** Indices for the columns we want, keyed by our own names. */
export function columnIndex(
  header: readonly string[],
  aliases: Record<string, readonly string[]>
): Record<string, number> {
  const normalised = header.map(normaliseHeader);
  const index: Record<string, number> = {};
  for (const [key, names] of Object.entries(aliases)) {
    index[key] = normalised.findIndex((column) => names.map(normaliseHeader).includes(column));
  }
  return index;
}

/**
 * Numbers as brokers write them: "1,234.56", "₹1,234.56", "(123)" for negative,
 * "-" for absent. Returns null rather than NaN so callers must decide.
 */
export function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[₹$,\s]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;

  const negative = /^\(.*\)$/.test(cleaned);
  const value = Number.parseFloat(negative ? cleaned.slice(1, -1) : cleaned);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}
