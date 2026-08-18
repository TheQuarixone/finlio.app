import Link from "next/link";
import { CopyEmail } from "@/components/copy-email";
import { CookiePreferencesButton } from "@/components/cookie-preferences-button";
import { InPageLink } from "@/components/in-page-link";
import { LogoMark } from "@/components/logo";
import { CONTACT, LEGAL_PAGES } from "@/lib/legal";

/* Site footer, shared by the landing page and the legal pages.

   Laid out as a brand block plus named link columns rather than one long row:
   the legal set has grown to five entries, and a single wrapping row gave no
   hint of which links belong together. Columns also give each phone-sized tap
   target its own line instead of packing them edge to edge.

   In-page links are written as `/#hash` rather than `#hash` so they work from
   a legal route too; on the landing page the smooth-scroll handler still picks
   them up and glides (see components/smooth-scroll.tsx). */

const PRODUCT_LINKS = [
  { label: "How it works", hash: "about" },
  { label: "FAQs", hash: "faqs" },
  { label: "Join the waitlist", hash: "waitlist" },
];

const linkClass =
  "inline-flex min-h-[44px] items-center text-body/60 transition-[color] hover:text-ink sm:min-h-0";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-body/45">
      {children}
    </h2>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-cream">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:py-16">
        <div className="reveal-rise rounded-2xl bg-white p-6 ring-1 ring-line sm:rounded-3xl sm:p-8">
          {/* Brand block sits above the columns on phones and beside them from
              md up, where there is room for a wider first column. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
            <div className="col-span-2 flex flex-col items-start gap-3 md:col-span-1">
              <InPageLink
                hash="top"
                className="flex items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
              >
                <LogoMark className="size-8 shrink-0" />
                <span className="text-[15px] font-semibold text-ink">
                  Finlio
                </span>
              </InPageLink>

              <p className="max-w-[24ch] text-[14px] leading-[1.5] text-body/60 [text-wrap:pretty]">
                Know why your money moved, in plain English.
              </p>

              <p className="inline-flex items-center gap-2.5 text-[14px] font-medium text-body">
                <span className="animate-status-pulse size-2.5 shrink-0 rounded-full bg-brand-green" />
                Coming soon
              </p>
            </div>

            <nav aria-label="Product">
              <ColumnHeading>Product</ColumnHeading>
              <ul className="mt-1 flex flex-col text-[15px] sm:mt-2 sm:gap-1">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.hash}>
                    <InPageLink hash={link.hash} className={linkClass}>
                      {link.label}
                    </InPageLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal">
              <ColumnHeading>Legal</ColumnHeading>
              <ul className="mt-1 flex flex-col text-[15px] sm:mt-2 sm:gap-1">
                {LEGAL_PAGES.map((page) => (
                  <li key={page.href}>
                    <Link href={page.href} className={linkClass}>
                      {page.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookiePreferencesButton className={`${linkClass} text-left`} />
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row-reverse sm:items-center sm:justify-between">
            <CopyEmail email={CONTACT.general} />
            <p className="text-[13px] text-body/50 sm:text-[14px]">
              © 2026 Finlio. Information and education, not investment advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
