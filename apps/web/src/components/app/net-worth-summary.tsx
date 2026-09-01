"use client";

import { formatMoney, formatPercentE4, type NetWorth } from "@finlio/core/domain";

const KIND_LABELS: Record<string, string> = {
  equity: "Equity",
  mutual_fund: "Mutual funds",
  fixed_deposit: "Fixed deposits",
  real_estate: "Real estate",
  cash: "Cash",
  epf: "EPF",
  ppf: "PPF",
  nps: "NPS",
  sgb: "Sovereign gold bonds",
  insurance: "Insurance",
};

/** Colour-coded by section, matching the palette in PRD §9. */
const SLICE_COLORS = [
  "var(--chart-1, #018dff)",
  "var(--chart-2, #34c759)",
  "var(--chart-3, #ff5310)",
  "var(--chart-4, #9553f9)",
  "var(--chart-5, #ffbe4c)",
];

export function NetWorthSummary({ netWorth }: { netWorth: NetWorth }) {
  const underwater = netWorth.netWorth.minor < 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-sm font-medium text-muted-foreground">Net worth</h2>
      <p
        className={`mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${
          underwater ? "text-destructive" : "text-foreground"
        }`}
      >
        {formatMoney(netWorth.netWorth)}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
        <div>
          <dt className="text-sm text-muted-foreground">Assets</dt>
          <dd className="mt-1 text-lg font-medium tabular-nums">
            {formatMoney(netWorth.totalAssets)}
          </dd>
          <dd className="text-xs text-muted-foreground">
            {netWorth.assetCount} {netWorth.assetCount === 1 ? "holding" : "holdings"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Liabilities</dt>
          <dd className="mt-1 text-lg font-medium tabular-nums">
            {formatMoney(netWorth.totalLiabilities)}
          </dd>
          <dd className="text-xs text-muted-foreground">
            {netWorth.liabilityCount} {netWorth.liabilityCount === 1 ? "account" : "accounts"}
          </dd>
        </div>
      </dl>

      {netWorth.allocation.length > 0 && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground">Allocation</h3>

          <div
            className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Asset allocation across ${netWorth.allocation.length} classes`}
          >
            {netWorth.allocation.map((slice, i) => (
              <div
                key={slice.kind}
                style={{
                  width: `${slice.shareE4 / 10_000}%`,
                  background: SLICE_COLORS[i % SLICE_COLORS.length],
                }}
              />
            ))}
          </div>

          <ul className="mt-4 space-y-2">
            {netWorth.allocation.map((slice, i) => (
              <li key={slice.kind} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                />
                <span className="flex-1">{KIND_LABELS[slice.kind] ?? slice.kind}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatPercentE4(slice.shareE4)}
                </span>
                <span className="w-28 text-right tabular-nums">{formatMoney(slice.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
