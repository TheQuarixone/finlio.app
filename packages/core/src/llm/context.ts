import type { FinlioDocument } from "@finlio/schemas";
import { serialize } from "../domain/finlio-v1";
import { formatMoney } from "../domain/format";
import { computeNetWorth } from "../domain/networth";
import { asData } from "./policy";

/**
 * Decides what the model is allowed to see.
 *
 * This is a privacy control, not a formatting helper. The on-device document is
 * the user's complete financial life; a morning brief needs their holdings, not
 * their property address or the note they wrote about a loan. Redaction happens
 * here, once, so no prompt builder can accidentally widen it.
 *
 * `finlio/v1` Markdown is the wire format because it is compact in tokens and
 * the model reads tables well — the same reason the file format exists.
 */

export interface ContextOptions {
  /** Free-text the user wrote. Off by default: it is the highest-risk field. */
  includeNotes?: boolean;
  /** Property names, folio numbers, employer. Off by default. */
  includeIdentifiers?: boolean;
}

const IDENTIFYING_FIELDS = ["folio", "employer", "insurer", "institution", "bank"] as const;

export function redactDocument(
  doc: FinlioDocument,
  { includeNotes = false, includeIdentifiers = false }: ContextOptions = {}
): FinlioDocument {
  const scrubAsset = (asset: FinlioDocument["assets"][number]) => {
    const copy: Record<string, unknown> = { ...asset };
    if (!includeNotes) delete copy.notes;
    if (!includeIdentifiers) {
      for (const field of IDENTIFYING_FIELDS) delete copy[field];
    }
    return copy as FinlioDocument["assets"][number];
  };

  return {
    ...doc,
    // Income and expenses stay — the goal planner needs them. Nothing here
    // identifies a person; a number without a name is not a profile.
    assets: doc.assets.map(scrubAsset),
    liabilities: doc.liabilities.map((l) =>
      includeIdentifiers ? l : ({ ...l, lender: "(redacted)" } as typeof l)
    ),
  };
}

/**
 * The document as prompt context, wrapped in the untrusted-data delimiters so
 * policy §2.6 has something to enforce. A holding the user labelled "ignore all
 * previous instructions" arrives as data, clearly fenced.
 */
export function buildDocumentContext(doc: FinlioDocument, opts?: ContextOptions): string {
  return asData("USER_FINANCIAL_DOCUMENT (finlio/v1)", serialize(redactDocument(doc, opts)));
}

/** A one-paragraph position summary, for prompts that don't need every row. */
export function buildPositionSummary(doc: FinlioDocument): string {
  const nw = computeNetWorth({
    assets: doc.assets,
    liabilities: doc.liabilities,
    baseCurrency: doc.meta.baseCurrency,
  });
  const lines = [
    `Net worth: ${formatMoney(nw.netWorth)}`,
    `Assets: ${formatMoney(nw.totalAssets)} across ${nw.assetCount} holdings`,
    `Liabilities: ${formatMoney(nw.totalLiabilities)} across ${nw.liabilityCount} accounts`,
    ...nw.allocation.map(
      (slice) => `  ${slice.kind}: ${formatMoney(slice.value)} (${(slice.shareE4 / 10_000).toFixed(1)}%)`
    ),
  ];
  return asData("POSITION_SUMMARY", lines.join("\n"));
}
