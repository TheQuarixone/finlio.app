/* One source of truth for the legal pages.

   Every page, the footer link row and the "related pages" strip read from
   here, so a changed contact address or review date is a one-line edit rather
   than a hunt through four documents.

   Fields we cannot state truthfully yet are left `undefined` on purpose: the
   pages omit those lines entirely instead of printing a placeholder into a
   live legal document. See docs/legal.md for the pre-launch checklist. */

export const COMPANY = {
  /** Product name, used throughout the copy. */
  name: "Finlio",
  /** The team behind the product. */
  operator: "Quarix",
  /** Registered entity name, e.g. "Quarix Technologies Private Limited". */
  legalName: undefined as string | undefined,
  /** Registered office, printed in the contact block when set. */
  registeredAddress: undefined as string | undefined,
  /** Seat of jurisdiction for the terms, e.g. "Chennai". Until this is set,
      the terms name the competent courts in India generally. */
  jurisdictionCity: undefined as string | undefined,
  country: "India",
  site: "https://finlio.app",
};

/* A single mailbox, because it is the only one that actually receives mail:
   hello@finlio.app is relayed through the Resend inbound webhook. Dedicated
   privacy@ / grievance@ aliases are worth adding before launch (docs/legal.md);
   naming them here first would publish addresses that bounce. */
export const CONTACT = {
  general: "hello@finlio.app",
  privacy: "hello@finlio.app",
  grievance: "hello@finlio.app",
};

/** Response windows we commit to in the policies. Days. */
export const RESPONSE_WINDOW = {
  /** Data-principal requests (access, correction, erasure). */
  request: 30,
  /** Grievance redressal, per the DPDP Rules 2025. */
  grievance: 90,
};

/** Reviewed and published on this date. Bump when a page changes materially. */
export const LEGAL_UPDATED = "2026-08-18";

export function formatLegalDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type LegalPageMeta = {
  href: string;
  /** Short label for the footer and the related-pages strip. */
  label: string;
  /** Full document title. */
  title: string;
  /** One line, shown under the title and on the related-pages cards. */
  summary: string;
  /** Section accent, matching the colour-coded sections of the landing page. */
  accent: string;
};

export const LEGAL_PAGES: LegalPageMeta[] = [
  {
    href: "/privacy",
    label: "Privacy",
    title: "Privacy Policy",
    summary:
      "What we collect, why we collect it, and the rights you have over it.",
    accent: "text-brand-blue",
  },
  {
    href: "/terms",
    label: "Terms",
    title: "Terms of Use",
    summary: "The rules for using this site and the Finlio waitlist.",
    accent: "text-brand-purple",
  },
  {
    href: "/cookies",
    label: "Cookies",
    title: "Cookie Policy",
    summary: "Every cookie this site can set, and how to change your choice.",
    accent: "text-brand-gold",
  },
  {
    href: "/disclaimer",
    label: "Disclaimer",
    title: "Financial Disclaimer",
    summary:
      "Finlio explains and suggests. It is not investment advice, and it never moves your money.",
    accent: "text-brand-orange",
  },
];

/** Looks up a page's metadata, so a page file and the footer cannot disagree
    about its title or accent. Throws at build time if the href is not
    registered above. */
export function legalPage(href: string): LegalPageMeta {
  const page = LEGAL_PAGES.find((candidate) => candidate.href === href);
  if (!page) throw new Error(`No legal page registered for ${href}`);
  return page;
}
