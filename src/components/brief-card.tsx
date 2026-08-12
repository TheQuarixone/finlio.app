import { LogoMark } from "@/components/logo";

/* Stands in for family.co's illustration beside the closing CTA. Rather than
   decoration, it shows the actual thing being signed up for: one morning
   message. Values are illustrative. */

function Holding({
  symbol,
  name,
  value,
  up,
  reason,
}: {
  symbol: string;
  name: string;
  value: string;
  up: boolean;
  reason: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-ink">
          {symbol}
          <span className="ml-1.5 font-normal text-body/55">{name}</span>
        </p>
        <p className="truncate text-[13px] text-body/70">{reason}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums ${
          up
            ? "bg-brand-green/10 text-brand-green"
            : "bg-brand-red/10 text-brand-red"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function BriefCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.05),0_20px_44px_rgba(18,18,18,0.10)] ring-1 ring-line sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-8 shrink-0 text-btn sm:size-9" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-[15px] font-semibold text-ink">
                Finlio
              </p>
              <p className="shrink-0 text-[13px] tabular-nums text-body/50">
                8:31 AM
              </p>
            </div>
            <p className="text-[13px] text-body/60">Your morning message</p>
          </div>
        </div>

        <p className="mt-5 text-[14px] leading-[1.5] text-body sm:text-[15px]">
          3 things you own may move today. Here is why.
        </p>

        <div className="mt-5 space-y-3.5 border-t border-line pt-5">
          <Holding
            symbol="TCS"
            name="Tata Consultancy"
            value="+1.8%"
            up
            reason="Strong results from US clients"
          />
          <Holding
            symbol="HDFCBANK"
            name="HDFC Bank"
            value="−0.6%"
            up={false}
            reason="RBI kept interest rates steady"
          />
          <Holding
            symbol="PPFAS"
            name="Parag Parikh Flexi Cap"
            value="+0.4%"
            up
            reason="Its top holdings went up"
          />
        </div>
      </div>
    </div>
  );
}
