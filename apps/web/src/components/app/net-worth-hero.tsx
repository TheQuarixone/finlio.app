"use client";

import type { NetWorth } from "@finlio/core/domain";
import { formatMoney } from "@finlio/core/domain";

/**
 * The headline card. Everything else on the page is a breakdown of this number.
 *
 * The dotted world map behind it is a CSS radial-gradient rather than an image:
 * it is decorative texture, and an asset request for texture is a request the
 * page can do without.
 */
export function NetWorthHero({
  netWorth,
  updatedAt,
}: {
  netWorth: NetWorth;
  updatedAt?: string;
}) {
  const underwater = netWorth.netWorth.minor < 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <section className="relative overflow-hidden rounded-3xl bg-[#232322] p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "9px 9px",
            maskImage: "radial-gradient(120% 90% at 78% 40%, #000 25%, transparent 72%)",
          }}
        />

        <div className="relative">
          <p className="text-sm text-white/55">Net worth</p>
          <p
            className={`mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-[2.75rem] ${
              underwater ? "text-[#ff8a6b]" : "text-white"
            }`}
          >
            {formatMoney(netWorth.netWorth)}
          </p>

          <dl className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/45">Assets</dt>
              <dd className="mt-1 text-lg font-medium tabular-nums">
                {formatMoney(netWorth.totalAssets)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/45">Liabilities</dt>
              <dd className="mt-1 text-lg font-medium tabular-nums text-white/80">
                {formatMoney(netWorth.totalLiabilities)}
              </dd>
            </div>
            <div className="ml-auto text-right">
              <dt className="sr-only">Holdings tracked</dt>
              <dd className="text-sm text-white/55">
                {netWorth.assetCount} {netWorth.assetCount === 1 ? "holding" : "holdings"}
                {netWorth.liabilityCount > 0 &&
                  ` · ${netWorth.liabilityCount} ${
                    netWorth.liabilityCount === 1 ? "loan" : "loans"
                  }`}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 sm:p-7">
        <div>
          <p className="text-sm text-muted-foreground">Stored on this device</p>
          <p className="mt-2 text-sm leading-relaxed">
            Your holdings are encrypted in this browser and never sent to our servers.
            We can&apos;t read them, and neither can anyone we might be asked to hand
            data to.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="size-2 rounded-full bg-[var(--chart-2)]" />
          {updatedAt ? `Last updated ${updatedAt}` : "Nothing saved yet"}
        </div>
      </section>
    </div>
  );
}
