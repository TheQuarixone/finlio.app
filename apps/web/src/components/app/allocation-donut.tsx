"use client";

import type { AllocationSlice } from "@finlio/core/domain";
import { formatMoney, formatPercentE4 } from "@finlio/core/domain";
import type { Money } from "@finlio/schemas";

/**
 * Allocation as a donut, drawn with inline SVG.
 *
 * No charting library: this is five arcs and a label. Pulling in a chart
 * dependency for it would cost more bundle than the whole dashboard, and the
 * one thing a library would give us — tooltips — is served better here by the
 * legend, which is readable on a phone and by a screen reader.
 *
 * The chart is `aria-hidden` and the same data is published as a list, because
 * a ring of arcs is not information to anyone using a screen reader.
 */

const RADIUS = 70;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Slices past the fifth are folded into one, so the ring stays readable. */
const MAX_SLICES = 5;

export const KIND_LABELS: Record<string, string> = {
  equity: "Equity",
  mutual_fund: "Mutual funds",
  fixed_deposit: "Fixed deposits",
  real_estate: "Real estate",
  cash: "Cash",
  epf: "EPF",
  ppf: "PPF",
  nps: "NPS",
  sgb: "Gold bonds",
  insurance: "Insurance",
};

export interface DonutDatum {
  key: string;
  label: string;
  value: Money;
  shareE4: number;
  color: string;
}

export function toDonutData(allocation: readonly AllocationSlice[]): DonutDatum[] {
  const head = allocation.slice(0, MAX_SLICES).map((slice, i) => ({
    key: slice.kind,
    label: KIND_LABELS[slice.kind] ?? slice.kind,
    value: slice.value,
    shareE4: slice.shareE4,
    color: SERIES[i % SERIES.length] as string,
  }));

  const tail = allocation.slice(MAX_SLICES);
  if (tail.length === 0) return head;

  return [
    ...head,
    {
      key: "__other",
      label: `${tail.length} more`,
      value: tail.reduce(
        (acc, s) => ({ minor: acc.minor + s.value.minor, currency: s.value.currency }),
        { minor: 0, currency: tail[0]!.value.currency }
      ),
      shareE4: tail.reduce((acc, s) => acc + s.shareE4, 0),
      color: "var(--muted-foreground)",
    },
  ];
}

export function AllocationDonut({ data, total }: { data: DonutDatum[]; total: Money }) {
  // Offsets are derived up front rather than accumulated inside the map: the
  // React Compiler (correctly) rejects a variable that keeps mutating as the
  // tree renders.
  const arcs = data.reduce<{ slice: DonutDatum; length: number; offset: number }[]>(
    (acc, slice) => {
      const previous = acc.at(-1);
      const offset = previous ? previous.offset + previous.length : 0;
      return [...acc, { slice, length: (slice.shareE4 / 1_000_000) * CIRCUMFERENCE, offset }];
    },
    []
  );

  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[220px] place-items-center">
      <svg viewBox="0 0 180 180" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="90" cy="90" r={RADIUS} fill="none"
          stroke="var(--muted)" strokeWidth={STROKE}
        />
        {arcs.map(({ slice, length, offset }) => (
          <circle
            key={slice.key}
            cx="90" cy="90" r={RADIUS} fill="none"
            stroke={slice.color}
            strokeWidth={STROKE}
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      <div className="absolute grid place-items-center text-center">
        <span className="text-xs text-muted-foreground">Total assets</span>
        <span className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
          {formatMoney(total, { compact: total.minor >= 10_000_000_00 })}
        </span>
      </div>
    </div>
  );
}

export function AllocationLegend({ data }: { data: DonutDatum[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {data.map((slice) => (
        <li key={slice.key} className="flex items-center gap-3 text-sm">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: slice.color }}
          />
          <span className="flex-1 truncate">{slice.label}</span>
          <span className="tabular-nums text-muted-foreground">
            {formatPercentE4(slice.shareE4)}
          </span>
          <span className="w-24 shrink-0 text-right tabular-nums">
            {formatMoney(slice.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
