import type { ReactNode } from "react";
import { CookiePreferencesButton } from "@/components/cookie-preferences-button";
import {
  CONTACT,
  COMPANY,
  LEGAL_PAGES,
  formatLegalDate,
  type LegalPageMeta,
} from "@/lib/legal";
import { A, P } from "@/components/legal/prose";

/* The shell every legal page shares.

   Standard legal-document furniture, in the landing page's visual language:
   an accent eyebrow, the document title, a plain-language summary before the
   binding text, the effective date, a numbered table of contents that sticks
   on desktop and collapses on phones, then numbered sections at a narrow
   measure. Sections come in as data rather than children so the contents list
   and the headings can never drift apart. */

export type LegalSection = {
  /** Anchor, also the deep link people paste into an email. */
  id: string;
  title: string;
  body: ReactNode;
};

export function LegalPage({
  meta,
  updated,
  intro,
  sections,
}: {
  meta: LegalPageMeta;
  /** ISO date. Rendered as the effective date and in the page's `<time>`. */
  updated: string;
  /** The plain-language read of the document, above the sections. */
  intro: ReactNode;
  sections: LegalSection[];
}) {
  const related = LEGAL_PAGES.filter((page) => page.href !== meta.href);

  return (
    <main id="top" className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32 lg:pt-36">
        <header className="max-w-3xl">
          <p
            className={`text-[13px] font-semibold uppercase tracking-[0.06em] ${meta.accent}`}
          >
            Legal
          </p>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.028em] text-jet sm:text-[42px] lg:text-[48px]">
            {meta.title}
          </h1>
          <p className="mt-4 text-[17px] font-medium leading-[1.5] tracking-[-0.013em] text-body [text-wrap:pretty] sm:text-[18px]">
            {meta.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-body/70">
            <span className="rounded-full bg-sand px-3 py-1.5">
              In effect from{" "}
              <time dateTime={updated}>{formatLegalDate(updated)}</time>
            </span>
            <span className="rounded-full bg-sand px-3 py-1.5">
              {COMPANY.name} by {COMPANY.operator}
            </span>
          </div>
        </header>

        <div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          {/* Desktop contents rail. `position: sticky` works here because the
              legal routes opt out of ScrollSmoother, whose transformed content
              would stop it from ever sticking (see components/smooth-scroll). */}
          <aside className="hidden lg:block">
            <nav aria-labelledby="contents-heading" className="sticky top-28">
              <h2
                id="contents-heading"
                className="text-[12px] font-semibold uppercase tracking-[0.06em] text-body/50"
              >
                On this page
              </h2>
              <ol className="mt-4 flex flex-col gap-2.5">
                {sections.map((section, index) => (
                  <li key={section.id} className="flex gap-2 text-[14px]">
                    <span className="tabular-nums text-body/40">
                      {index + 1}.
                    </span>
                    <a
                      href={`#${section.id}`}
                      className="leading-[1.45] text-body/70 transition-[color] hover:text-ink"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0 max-w-3xl">
            <div className="rounded-2xl bg-cream p-5 ring-1 ring-line sm:rounded-3xl sm:p-6">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-body/50">
                In short
              </h2>
              <div className="[&>p:first-child]:mt-2">{intro}</div>
              <p className="mt-4 text-[13px] font-medium leading-[1.5] text-body/60">
                This summary is here to help you read the rest. The numbered
                sections below are the ones that apply.
              </p>
            </div>

            {/* Phone and tablet contents, collapsed by default. */}
            <details className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line lg:hidden">
              <summary className="text-[14px] font-semibold text-ink">
                On this page
              </summary>
              <ol className="mt-4 flex flex-col gap-2.5">
                {sections.map((section, index) => (
                  <li key={section.id} className="flex gap-2 text-[15px]">
                    <span className="tabular-nums text-body/40">
                      {index + 1}.
                    </span>
                    <a href={`#${section.id}`} className="text-body/80">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <article className="mt-10 sm:mt-14">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  /* Clears the fixed header pill when a deep link lands here. */
                  className="scroll-mt-28 border-t border-line pt-8 first:border-t-0 first:pt-0 [&:not(:first-child)]:mt-12"
                >
                  <h2 className="flex gap-3 text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] text-jet sm:text-[23px]">
                    <span
                      aria-hidden
                      className={`tabular-nums font-semibold ${meta.accent}`}
                    >
                      {index + 1}
                    </span>
                    <span>{section.title}</span>
                  </h2>
                  <div>{section.body}</div>
                </section>
              ))}
            </article>

            <div className="mt-12 rounded-2xl bg-sand p-6 ring-1 ring-line sm:rounded-3xl sm:p-7">
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-jet">
                Questions about this page?
              </h2>
              <P>
                Write to <A href={`mailto:${CONTACT.general}`}>{CONTACT.general}</A>{" "}
                and a person will read it. If you are asking about your data,
                say so in the subject line and we will treat it as a request
                under the Digital Personal Data Protection Act.
              </P>
              {COMPANY.legalName ? (
                <P>
                  {COMPANY.name} is operated by {COMPANY.legalName}
                  {COMPANY.registeredAddress
                    ? `, ${COMPANY.registeredAddress}`
                    : ""}
                  .
                </P>
              ) : null}
              <p className="mt-5 text-[13px] font-medium text-body/60">
                Also here:{" "}
                <CookiePreferencesButton className="underline decoration-line underline-offset-4 transition-[color] hover:text-ink" />
                .
              </p>
            </div>

            <nav aria-label="Other legal pages" className="mt-10">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-body/50">
                The rest of the legal pages
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((page) => (
                  <li key={page.href}>
                    <a
                      href={page.href}
                      className="flex h-full flex-col gap-1.5 rounded-2xl bg-white p-4 ring-1 ring-line transition-[background-color,transform] duration-200 hover:-translate-y-[2px] hover:bg-cream"
                    >
                      <span className="text-[15px] font-semibold text-ink">
                        {page.title}
                      </span>
                      <span className="text-[13px] font-medium leading-[1.45] text-body/70">
                        {page.summary}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </main>
  );
}
