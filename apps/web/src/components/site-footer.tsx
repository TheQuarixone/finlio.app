import Link from "next/link";
import { CopyEmail } from "@/components/copy-email";
import { CookiePreferencesButton } from "@/components/cookie-preferences-button";
import { InPageLink } from "@/components/in-page-link";
import { LogoMark } from "@/components/logo";
import { CONTACT, LEGAL_PAGES } from "@/lib/legal";

/* Site footer, shared by the landing page and the legal pages.

   In-page links are written as `/#hash` rather than `#hash` so they work from
   a legal route too; on the landing page the smooth-scroll handler still picks
   them up and glides (see components/smooth-scroll.tsx). */

const PRODUCT_LINKS = [
  { label: "How it works", hash: "about" },
  { label: "FAQs", hash: "faqs" },
  { label: "Join the waitlist", hash: "waitlist" },
];

export function SiteFooter() {
  return (
    <footer className="bg-cream">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:py-16">
        <div className="reveal-rise flex flex-col gap-8 rounded-2xl bg-white p-6 ring-1 ring-line sm:rounded-3xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <InPageLink
              hash="top"
              className="flex items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            >
              <LogoMark className="size-8 shrink-0" />
              <span className="text-[15px] font-semibold text-ink">Finlio</span>
            </InPageLink>

            <nav aria-label="Product">
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.hash}>
                    <InPageLink
                      hash={link.hash}
                      className="inline-flex min-h-[44px] items-center text-body/60 transition-[color] hover:text-ink sm:min-h-0"
                    >
                      {link.label}
                    </InPageLink>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="inline-flex items-center gap-2.5 text-[14px] font-medium text-body">
              <span className="animate-status-pulse size-2.5 shrink-0 rounded-full bg-brand-green" />
              Coming soon
            </p>
          </div>

          <div className="flex flex-col gap-5 border-t border-line pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <nav aria-label="Legal">
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                  {LEGAL_PAGES.map((page) => (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        className="text-body/60 transition-[color] hover:text-ink"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <CookiePreferencesButton className="text-[14px] text-body/60 transition-[color] hover:text-ink" />
                  </li>
                </ul>
              </nav>

              <CopyEmail email={CONTACT.general} />
            </div>

            <p className="text-[13px] text-body/50 sm:text-[14px]">
              © 2026 Finlio. Information and education, not investment advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
