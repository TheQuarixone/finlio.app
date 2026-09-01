import {
  type Asset, type CurrencyCode, type FinlioDocument, type Goal,
  type Liability, type MonthlySnapshot, FINLIO_SCHEMA_VERSION,
  FinlioDocument as FinlioDocumentSchema, MINOR_UNITS_PER_MAJOR,
} from "@finlio/schemas";

/**
 * The `finlio/v1` Markdown codec (PRD Appendix A).
 *
 * Markdown is the *serialization* format; the model is `FinlioDocument`. The
 * format is human-readable on purpose — it is the user's data, they can open it
 * in any editor, and "you can read your own file" is a large part of what
 * privacy-first means here. It is also cheap in tokens, which is why the agents
 * get it as prompt context.
 *
 * Everything round-trips: `parse(serialize(doc))` deep-equals `doc`.
 */

type Codec = {
  toCell(value: unknown, currency: CurrencyCode): string;
  fromCell(raw: string, currency: CurrencyCode): unknown;
};

const str: Codec = {
  toCell: (v) => (v == null ? "" : String(v)),
  fromCell: (raw) => (raw === "" ? undefined : raw),
};

const int: Codec = {
  toCell: (v) => (v == null ? "" : String(v)),
  fromCell: (raw) => (raw === "" ? undefined : Number.parseInt(raw, 10)),
};

/** Money renders as a plain major-unit decimal — "2850.00", not "₹2,850". */
const cash: Codec = {
  toCell: (v) =>
    v == null ? "" : ((v as { minor: number }).minor / MINOR_UNITS_PER_MAJOR).toFixed(2),
  fromCell: (raw, currency) =>
    raw === ""
      ? undefined
      : { minor: Math.round(Number.parseFloat(raw) * MINOR_UNITS_PER_MAJOR), currency },
};

type Column = readonly [header: string, key: string, codec: Codec];

const ASSET_COLUMNS: Record<Asset["kind"], readonly Column[]> = {
  equity: [
    ["Id", "id", str], ["Label", "label", str], ["Ticker", "ticker", str],
    ["Exchange", "exchange", str], ["Qty", "qty", int], ["Avg Price", "avgPrice", cash],
    ["Sector", "sector", str], ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  mutual_fund: [
    ["Id", "id", str], ["Label", "label", str], ["ISIN", "isin", str], ["Fund", "fund", str],
    ["Units(e6)", "unitsE6", int], ["Purchase NAV", "purchaseNav", cash],
    ["Folio", "folio", str], ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  fixed_deposit: [
    ["Id", "id", str], ["Label", "label", str], ["Bank", "bank", str],
    ["Principal", "principal", cash], ["Rate(e4)", "ratePctE4", int],
    ["Start", "startDate", str], ["Maturity", "maturityDate", str],
    ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  real_estate: [
    ["Id", "id", str], ["Label", "label", str], ["Type", "propertyType", str],
    ["Purchase Price", "purchasePrice", cash], ["Est Value", "estimatedValue", cash],
    ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  cash: [
    ["Id", "id", str], ["Label", "label", str], ["Institution", "institution", str],
    ["Balance", "balance", cash], ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  epf: [
    ["Id", "id", str], ["Label", "label", str], ["Employer", "employer", str],
    ["Balance", "balance", cash], ["As Of", "asOf", str],
    ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  ppf: [
    ["Id", "id", str], ["Label", "label", str], ["Bank", "bank", str],
    ["Balance", "balance", cash], ["Maturity", "maturityDate", str],
    ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  nps: [
    ["Id", "id", str], ["Label", "label", str], ["Tier", "tier", str],
    ["Balance", "balance", cash], ["As Of", "asOf", str],
    ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  sgb: [
    ["Id", "id", str], ["Label", "label", str], ["Series", "series", str],
    ["Grams(e6)", "gramsE6", int], ["Purchase Price", "purchasePrice", cash],
    ["Maturity", "maturityDate", str], ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
  insurance: [
    ["Id", "id", str], ["Label", "label", str], ["Policy", "policyType", str],
    ["Insurer", "insurer", str], ["Cover", "cover", cash],
    ["Annual Premium", "annualPremium", cash], ["Surrender Value", "surrenderValue", cash],
    ["Value", "manualValue", cash], ["Updated", "updatedAt", str],
  ],
};

const ASSET_HEADINGS: Record<Asset["kind"], string> = {
  equity: "Equity", mutual_fund: "Mutual Funds", fixed_deposit: "Fixed Deposits",
  real_estate: "Real Estate", cash: "Cash", epf: "EPF", ppf: "PPF", nps: "NPS",
  sgb: "Sovereign Gold Bonds", insurance: "Insurance",
};

const LIABILITY_COLUMNS: readonly Column[] = [
  ["Id", "id", str], ["Kind", "kind", str], ["Label", "label", str], ["Lender", "lender", str],
  ["Outstanding", "outstanding", cash], ["EMI", "emi", cash], ["Rate(e4)", "ratePctE4", int],
  ["End Date", "endDate", str], ["Updated", "updatedAt", str],
];

const GOAL_COLUMNS: readonly Column[] = [
  ["Id", "id", str], ["Name", "name", str], ["Target", "target", cash],
  ["Deadline", "deadline", str], ["Linked", "linkedAssetIds", str],
  ["Created", "createdAt", str], ["Updated", "updatedAt", str],
];

const SNAPSHOT_COLUMNS: readonly Column[] = [
  ["Month", "month", str], ["Net Worth", "netWorth", cash], ["Assets", "totalAssets", cash],
  ["Liabilities", "totalLiabilities", cash], ["Savings Rate(e4)", "savingsRateE4", int],
];

/** A pipe inside a cell would break the table, so it is escaped both ways. */
const escapeCell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const unescapeCell = (s: string) => s.replace(/\\\|/g, "|");

function renderTable(
  columns: readonly Column[],
  rows: readonly Record<string, unknown>[],
  currency: CurrencyCode
): string {
  const header = `| ${columns.map((c) => c[0]).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${columns.map(([, key, codec]) => escapeCell(codec.toCell(row[key], currency))).join(" | ")} |`
  );
  return [header, divider, ...body].join("\n");
}

function parseTable(
  block: string,
  columns: readonly Column[],
  currency: CurrencyCode
): Record<string, unknown>[] {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
  // [0] is the header, [1] the divider; data starts at [2].
  return lines.slice(2).map((line) => {
    const cells = line.slice(1, line.endsWith("|") ? -1 : undefined).split(/(?<!\\)\|/).map((c) => unescapeCell(c.trim()));
    const row: Record<string, unknown> = {};
    columns.forEach(([, key, codec], i) => {
      const value = codec.fromCell(cells[i] ?? "", currency);
      if (value !== undefined) row[key] = value;
    });
    return row;
  });
}

function frontmatter(doc: FinlioDocument): string {
  const { meta } = doc;
  const lines = [
    "---",
    `schema: ${meta.schema}`,
    `base_currency: ${meta.baseCurrency}`,
  ];
  if (meta.riskProfile) lines.push(`risk_profile: ${meta.riskProfile}`);
  if (meta.annualIncome) lines.push(`annual_income: ${(meta.annualIncome.minor / MINOR_UNITS_PER_MAJOR).toFixed(2)}`);
  if (meta.monthlyExpenses) lines.push(`monthly_expenses: ${(meta.monthlyExpenses.minor / MINOR_UNITS_PER_MAJOR).toFixed(2)}`);
  if (meta.lastSync) lines.push(`last_sync: ${meta.lastSync}`);
  lines.push("---");
  return lines.join("\n");
}

export function serialize(doc: FinlioDocument): string {
  const currency = doc.meta.baseCurrency;
  const out: string[] = [frontmatter(doc), "", "# Financial Profile", ""];

  out.push("## Assets", "");
  for (const kind of Object.keys(ASSET_COLUMNS) as Asset["kind"][]) {
    const rows = doc.assets.filter((a) => a.kind === kind);
    if (rows.length === 0) continue;
    out.push(`### ${ASSET_HEADINGS[kind]}`, "");
    out.push(renderTable(ASSET_COLUMNS[kind], rows, currency), "");
  }

  out.push("## Liabilities", "");
  out.push(renderTable(LIABILITY_COLUMNS, doc.liabilities, currency), "");
  out.push("## Goals", "");
  out.push(renderTable(GOAL_COLUMNS, doc.goals, currency), "");
  out.push("## Monthly Snapshot", "");
  out.push(renderTable(SNAPSHOT_COLUMNS, doc.snapshots, currency), "");

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export class FinlioParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinlioParseError";
  }
}

/** Split the body into `### Heading` / `## Heading` blocks. */
function sections(markdown: string, depth: 2 | 3): Map<string, string> {
  const marker = depth === 2 ? "## " : "### ";
  const found = new Map<string, string>();
  const lines = markdown.split("\n");
  let current: string | null = null;
  let buffer: string[] = [];
  for (const line of lines) {
    const isThisDepth = line.startsWith(marker) && !line.startsWith(`${marker}#`);
    const isShallower = depth === 3 && line.startsWith("## ") && !line.startsWith("### ");
    if (isThisDepth) {
      if (current) found.set(current, buffer.join("\n"));
      current = line.slice(marker.length).trim();
      buffer = [];
    } else if (isShallower && current) {
      found.set(current, buffer.join("\n"));
      current = null;
      buffer = [];
    } else if (current) {
      buffer.push(line);
    }
  }
  if (current) found.set(current, buffer.join("\n"));
  return found;
}

export function parse(markdown: string): FinlioDocument {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch?.[1]) throw new FinlioParseError("Missing finlio/v1 frontmatter.");

  const meta: Record<string, string> = {};
  for (const line of fmMatch[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  if (meta.schema !== FINLIO_SCHEMA_VERSION) {
    throw new FinlioParseError(`Unsupported schema "${meta.schema ?? "(none)"}".`);
  }

  const currency = (meta.base_currency ?? "INR") as CurrencyCode;
  const body = markdown.slice(fmMatch[0].length);
  const top = sections(body, 2);

  const assets: Asset[] = [];
  const assetBlock = top.get("Assets") ?? "";
  const byHeading = sections(assetBlock, 3);
  for (const kind of Object.keys(ASSET_COLUMNS) as Asset["kind"][]) {
    const block = byHeading.get(ASSET_HEADINGS[kind]);
    if (!block) continue;
    for (const row of parseTable(block, ASSET_COLUMNS[kind], currency)) {
      assets.push({ ...row, kind } as Asset);
    }
  }

  const liabilities = parseTable(top.get("Liabilities") ?? "", LIABILITY_COLUMNS, currency) as unknown as Liability[];
  const goals = parseTable(top.get("Goals") ?? "", GOAL_COLUMNS, currency).map((row) => ({
    ...row,
    linkedAssetIds:
      typeof row.linkedAssetIds === "string" && row.linkedAssetIds.length > 0
        ? row.linkedAssetIds.split(";").map((s) => s.trim())
        : [],
  })) as unknown as Goal[];
  const snapshots = parseTable(top.get("Monthly Snapshot") ?? "", SNAPSHOT_COLUMNS, currency) as unknown as MonthlySnapshot[];

  const parsed = FinlioDocumentSchema.safeParse({
    meta: {
      schema: FINLIO_SCHEMA_VERSION,
      baseCurrency: currency,
      ...(meta.risk_profile ? { riskProfile: meta.risk_profile } : {}),
      ...(meta.annual_income
        ? { annualIncome: { minor: Math.round(Number.parseFloat(meta.annual_income) * MINOR_UNITS_PER_MAJOR), currency } }
        : {}),
      ...(meta.monthly_expenses
        ? { monthlyExpenses: { minor: Math.round(Number.parseFloat(meta.monthly_expenses) * MINOR_UNITS_PER_MAJOR), currency } }
        : {}),
      ...(meta.last_sync ? { lastSync: meta.last_sync } : {}),
    },
    assets, liabilities, goals, snapshots,
  });

  if (!parsed.success) {
    throw new FinlioParseError(`Document failed validation: ${parsed.error.issues[0]?.message ?? "unknown"}`);
  }
  return parsed.data;
}
