/* Sits beside the closing CTA. Not a mock of the app's screen — it's a
   before/after that shows the core value: the same market event, first in the
   jargon you'd read elsewhere, then in the plain words Finlio sends you. A
   concept comparison, so nothing here promises a specific product UI. The
   example is illustrative. */

function NewspaperIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <rect x="2.5" y="4" width="15" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7.5h6M5.5 10h6M5.5 12.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BriefCard() {
  return (
    <div data-brief className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl bg-white p-6 ring-1 ring-line sm:rounded-3xl sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-body/65">
            The same news, two ways
          </p>
          <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-body/55 ring-1 ring-line">
            Example
          </span>
        </div>

        {/* Before → after, stacked with a down arrow between. */}
        <div className="mt-5 flex flex-col">
          {/* Before: the jargon you get elsewhere */}
          <div data-brief-row className="rounded-2xl bg-cream p-4 ring-1 ring-line">
            <div className="flex items-center gap-2 text-body/50">
              <NewspaperIcon />
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em]">
                What you read elsewhere
              </span>
            </div>
            <p className="mt-2 text-[14px] leading-[1.5] text-body/75 [text-wrap:pretty]">
              “TCS Q3 net profit up 8.3% YoY, beats street estimates on robust
              BFSI demand.”
            </p>
          </div>

          {/* Connector */}
          <div data-brief-row className="flex items-center justify-center py-1.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-line">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="size-4 text-body/40"
              >
                <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          {/* After: Finlio's plain-words version */}
          <div data-brief-row className="rounded-2xl bg-brand-green/[0.06] p-4 ring-1 ring-brand-green/25">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-brand-green">
                <span className="size-1.5 shrink-0 rounded-full bg-brand-green" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em]">
                  What Finlio tells you
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-brand-green/10 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-brand-green">
                +1.8%
              </span>
            </div>
            <p className="mt-2 text-[15px] font-medium leading-[1.45] tracking-[-0.011em] text-ink [text-wrap:pretty]">
              TCS earned more than expected last quarter. Your TCS shares could
              go up today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
