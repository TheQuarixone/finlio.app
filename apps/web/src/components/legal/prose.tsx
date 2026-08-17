import Link from "next/link";
import type { ReactNode } from "react";

/* Typographic primitives for the legal pages.

   Legal text is read in two ways: skimmed for the one clause that matters, and
   read closely once. So the measure stays narrow, the rhythm between blocks is
   generous, and tables carry the itemised parts (what we collect, which cookie
   does what) that would otherwise disappear into paragraphs. The type scale is
   the landing page's, one step down. */

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[15px] font-medium leading-[1.65] tracking-[-0.011em] text-body [text-wrap:pretty] sm:text-[16px]">
      {children}
    </p>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 flex flex-col gap-2.5 text-[15px] font-medium leading-[1.6] text-body sm:text-[16px]">
      {children}
    </ul>
  );
}

export function Li({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-5 [text-wrap:pretty] before:absolute before:left-0 before:top-[0.62em] before:size-1.5 before:rounded-full before:bg-line">
      {children}
    </li>
  );
}

/** Inline emphasis for defined terms and the parts people quote back at us. */
export function T({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const className =
    "font-medium text-brand-link underline decoration-brand-link/30 underline-offset-[3px] transition-[text-decoration-color] hover:decoration-brand-link";

  // Internal routes get client navigation; mail and off-site links stay plain
  // anchors, and off-site ones open in a new tab.
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const offsite = href.startsWith("http");
  return (
    <a
      href={href}
      {...(offsite ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={className}
    >
      {children}
    </a>
  );
}

/** A pulled-out clause. Accent-tinted, for the lines that carry real weight. */
export function Callout({
  children,
  tone = "sand",
}: {
  children: ReactNode;
  tone?: "sand" | "amber" | "orange";
}) {
  const tones = {
    sand: "bg-sand ring-line",
    amber: "bg-brand-amber/12 ring-brand-amber/30",
    orange: "bg-brand-orange/8 ring-brand-orange/25",
  };

  return (
    <div
      className={`mt-5 rounded-2xl p-5 ring-1 ${tones[tone]} [&>p:first-child]:mt-0`}
    >
      {children}
    </div>
  );
}

/* Itemised tables. On phones a table would either overflow or crush to
   unreadable columns, so each row restacks into a labelled block below sm and
   the header row is hidden. */

export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-line">
      <table className="w-full border-collapse text-left text-[14px] sm:text-[15px]">
        <thead className="hidden sm:table-header-group">
          <tr className="bg-sand">
            {head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="block border-t border-line first:border-t-0 sm:table-row sm:first:border-t"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="block px-4 pb-3 pt-0 align-top font-medium leading-[1.55] text-body first:pt-3 first:font-semibold first:text-ink sm:table-cell sm:py-3 sm:first:pt-3"
                >
                  <span
                    aria-hidden
                    className="mb-0.5 block text-[12px] font-semibold uppercase tracking-[0.04em] text-body/50 sm:hidden"
                  >
                    {head[cellIndex]}
                  </span>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
