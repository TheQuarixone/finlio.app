"use client";

import { useRef, useState } from "react";
import type { Asset } from "@finlio/schemas";
import {
  BROKER_LABELS, type BrokerId, type ImportResult, type MergePlan,
  applyMerge, detectBroker, parseHoldings, planMerge,
} from "@finlio/core/import";
import { formatMoney } from "@finlio/core/domain";
import { Button } from "@/components/ui/button";

/**
 * Broker CSV import (PRD ON-4).
 *
 * The file is read with `FileReader` and parsed in this tab. It is never
 * uploaded — there is no endpoint to upload it to, by design (ADR-0004).
 *
 * Nothing is written until the user confirms. An import that silently merged
 * would be a bad trade: broker exports vary, and the cost of a wrong parse is a
 * net worth the user no longer trusts.
 */
export function ImportCsv({
  existing,
  onApply,
}: {
  existing: readonly Asset[];
  onApply: (assets: Asset[]) => void | Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [broker, setBroker] = useState<BrokerId | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setPlan(null);

    const text = await file.text();
    const detected = detectBroker(text);

    if (!detected) {
      setError(
        "We couldn't recognise this file. Export your holdings from Zerodha Console or Groww and try that."
      );
      return;
    }

    const parsed = parseHoldings(text, detected, {
      now: new Date(),
      makeId: () => crypto.randomUUID(),
    });

    setBroker(detected);
    setResult(parsed);
    setPlan(planMerge(existing, parsed.rows.map((row) => row.asset)));
  }

  async function confirm() {
    if (!plan) return;
    setBusy(true);
    await onApply(applyMerge(existing, plan));
    setBusy(false);
    reset();
  }

  function reset() {
    setBroker(null);
    setResult(null);
    setPlan(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold">Import from your broker</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Zerodha or Groww holdings export. The file is read in this browser and never
        leaves your device.
      </p>

      {!result && (
        <div className="mt-5">
          <Button type="button" onClick={() => fileInput.current?.click()}>
            Choose a CSV
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={choose}
            className="sr-only"
            aria-label="Choose a broker holdings CSV"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && plan && (
        <div className="mt-5">
          <p className="text-sm">
            <span className="font-medium">{BROKER_LABELS[broker!]}</span> export —{" "}
            {plan.added.length} new, {plan.updated.length} updated,{" "}
            {plan.unchanged.length} unchanged.
          </p>

          {plan.added.length + plan.updated.length > 0 && (
            <ul className="mt-4 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
              {plan.added.map((asset) => (
                <li key={asset.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="rounded bg-[color-mix(in_oklab,var(--chart-2)_18%,transparent)] px-1.5 py-0.5 text-xs">
                    new
                  </span>
                  <span className="flex-1 truncate">{asset.label}</span>
                  {asset.kind === "equity" && (
                    <span className="tabular-nums text-muted-foreground">
                      {asset.qty} × {formatMoney(asset.avgPrice)}
                    </span>
                  )}
                </li>
              ))}
              {plan.updated.map(({ existing: was, incoming }) => (
                <li key={was.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="rounded bg-[color-mix(in_oklab,var(--chart-1)_18%,transparent)] px-1.5 py-0.5 text-xs">
                    update
                  </span>
                  <span className="flex-1 truncate">{incoming.label}</span>
                  {was.kind === "equity" && incoming.kind === "equity" && (
                    <span className="tabular-nums text-muted-foreground">
                      {was.qty} → {incoming.qty}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {result.skipped.length > 0 && (
            <details className="mt-4 rounded-xl border border-border px-4 py-3">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                {result.skipped.length} row{result.skipped.length === 1 ? "" : "s"} skipped
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {result.skipped.map((row) => (
                  <li key={`${row.line}-${row.source}`}>
                    Line {row.line}: {row.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={confirm}
              disabled={busy || plan.added.length + plan.updated.length === 0}
            >
              {busy ? "Importing…" : "Import these"}
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
