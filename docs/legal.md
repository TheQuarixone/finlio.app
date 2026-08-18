# Legal pages, cookie consent, and what still needs a lawyer

What is live, the rules it was written against, and the short list of things a
human has to decide before launch. Companion to [`PRD.md`](./PRD.md) §8 (privacy
architecture) and the [architecture doc](./architecture.md).

> **These pages are not legal advice and have not been reviewed by a lawyer.**
> They are an honest, current description of what the site does, written to the
> obligations below. Before Finlio takes its first paying customer, an Indian
> lawyer should read them. See [Before launch](#before-launch).

---

## 1. What is live

| Route | Page | Covers |
|---|---|---|
| `/privacy` | Privacy Policy | Itemised notice, purposes, processors, transfers, retention, rights, grievances, children, breaches |
| `/terms` | Terms of Use | Waitlist rules, acceptable use, no-advice clause, IP, warranties, liability, governing law |
| `/cookies` | Cookie Policy | Every cookie the site can set, the two categories, how to change consent |
| `/disclaimer` | Financial Disclaimer | Not investment advice, no SEBI registration, suggests-never-executes, AI limits, data accuracy |

Supporting code:

- `src/lib/legal.ts` — company details, contacts, response windows, the page
  registry. **Single place to edit.**
- `src/lib/consent.ts` — the consent cookie (`finlio_consent`), read/write, and
  the `useSyncExternalStore` plumbing. `hasConsent("analytics")` is what
  analytics must gate on.
- `src/components/cookie-banner.tsx` — two-layer consent banner.
- `src/components/legal/` — the shared page shell and prose primitives. Sections
  are data, so the contents list cannot drift from the headings.
- `src/components/site-footer.tsx` — legal links plus **Cookie preferences** on
  every route.

Every page carries the same review date, from `LEGAL_UPDATED`. Bump it when a
page changes materially.

---

## 2. The rules these were written against

### India: DPDP Act 2023 + DPDP Rules 2025

The Rules were notified on **13 November 2025**, with a phased runway: consent
manager obligations at 12 months (**13 November 2026**) and the full data
fiduciary obligations at 18 months (**13 May 2027**). Penalties reach **₹250
crore** per violation. We comply now rather than in 2027.

What that requires of a site like ours:

- **An itemised, standalone notice**, in plain language, separate from the terms.
  Generic "we collect data to improve our services" does not satisfy it. Our
  privacy page states each item, when it is collected, and why, in a table.
- **Consent that is free, specific, informed, unconditional, and given by clear
  affirmative action.** No pre-ticked boxes, no bundling.
- **Withdrawal as easy as giving it.**
- **Data principal rights**: access, correction, completion, updating, erasure,
  withdrawal, and **nomination** (someone to act for you if you cannot).
- **Grievance redressal within 90 days**, with escalation to the Data Protection
  Board of India.
- **Breach reporting**: intimate affected users without delay, detailed report to
  the Board **within 72 hours**.
- **Children**: verifiable parental consent, and no behavioural monitoring or
  targeted advertising to children. We avoid the whole question by restricting
  the waitlist to adults.
- **Purpose-limited retention**, and a **48-hour notice before erasure** where
  that applies.
- Contact details for the person who answers data questions must be published. A
  DPO is only mandatory for a Significant Data Fiduciary, which we are not.

### Cookie consent (DPDP and, for EU/UK readers, GDPR)

Both regimes now land in the same place, and the banner is built to the stricter
reading:

- Non-essential categories **default to off**.
- **Granular** per-category toggles. One "all non-essential" switch is not enough.
- **Reject all must sit on the first layer**, with the same prominence as accept.
- Consent is an affirmative act; silence, scrolling and pre-ticks are not consent.

### Email

Marketing email to Indian recipients needs **prior affirmative consent**, and
every message needs a working unsubscribe that takes **one click** and no login.
**We do not have this yet** (see the checklist below); the pages say so honestly
rather than claiming a link that does not exist.

### SEBI framing

The enforcement point that matters: **SEBI looks at the substance of the
activity, not the disclaimer**. Calling output "educational" does not help if the
activity is personalised advice for consideration. Firms have been penalised for
exactly that, disclaimers included.

So the disclaimer page is a description of a design constraint, not a shield:

- General explanation and education, never personalised recommendations to buy,
  sell or hold.
- No registration claimed, because there is none. Not an investment adviser, not
  a research analyst, not a broker, not a distributor.
- **No commission from any product that appears in the output.** The moment
  revenue depends on what a user buys, the analysis changes and so must the page.
- Suggests, never executes. No trade placement, no money movement, and account
  access only through Account Aggregator tokens, never credentials.

If Finlio ever moves toward personalised, paid recommendations, that is a
**SEBI Investment Adviser registration** conversation before it is a copy
conversation.

---

## 3. Before launch

Blocking, in rough order:

- [ ] **Legal entity.** Set `COMPANY.legalName`, `registeredAddress` and
      `jurisdictionCity` in `src/lib/legal.ts`. Until they are set the pages omit
      those lines, and the terms name Indian courts generally instead of a seat.
- [x] **Dedicated mailboxes.** `privacy@` and `grievance@finlio.app` are
      published and relayed. Resend's inbound MX covers the whole domain, so all
      three addresses hit the same webhook and forward to `INBOUND_FORWARD_TO`.
      The set lives in `src/lib/inbound.ts`; add an address there *before*
      publishing it in `CONTACT`, or the pages advertise a mailbox that bounces.
      The relay now refuses to forward to one of our own inbound addresses,
      which would otherwise loop. **Confirm in the Resend dashboard** that
      inbound is enabled for the domain (not only for `hello@`), then send a
      test mail to each address.
- [ ] **Name the person** who answers data questions and handles grievances.
- [ ] **One-click unsubscribe** before any email beyond the confirmation goes
      out: an unsubscribe link plus `List-Unsubscribe` headers, and a route that
      flips `subscribers.status` to `unsubscribed`. The `status` column already
      exists for this.
- [ ] **Lawyer review** of all four pages, with the SEBI wording read by someone
      who does securities work in India.
- [ ] **Pin the Supabase region** and state it in the privacy policy rather than
      the current "a region we choose".
- [ ] **Consent records.** Keep the timestamp and the version of what was agreed;
      the consent cookie carries both, but the waitlist row should record signup
      consent too.

When the product and payments land:

- [ ] **Refunds and cancellation page** (DodoPayments, phase 4), plus pricing
      terms and any app-store IAP wording.
- [ ] **Rewrite the privacy policy for the product**: auth, the on-device store,
      Account Aggregator, and per-table RLS. The current page deliberately says
      it covers the waitlist only.
- [ ] **Sub-processor list** kept current as suppliers are added.
- [ ] Reassess **Significant Data Fiduciary** status as the user base grows
      (annual DPIA, audits, DPO).
- [ ] Add the legal routes to a `sitemap.ts` when one exists.

---

## 4. Sources

- [DPDP Rules 2025 notified by MeitY (EY India)](https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025)
- [India DPDP Act phase 1 compliance guide (Secure Privacy)](https://secureprivacy.ai/blog/india-dpdp-act-phase-1)
- [India's new data privacy rules: 8 steps for businesses (Fisher Phillips)](https://www.fisherphillips.com/en/insights/insights/indias-new-data-privacy-rules-are-here)
- [DPDP Rules 2025: India notifies digital privacy law (India Briefing)](https://www.india-briefing.com/news/dpdp-rules-2025-india-data-protection-law-compliance-40769.html/)
- [Cookie consent requirements under the DPDP Act (consent.in)](https://www.consent.in/blog/cookie-consent)
- [DPDP Act + Rules 2025: the new standard for cookie consent (GoTrust)](https://www.gotrust.tech/blog/dpdp-act-rules-2025-the-new-standard-for-cookie-consent-(and-how-to-get-it-right))
- [GDPR cookie consent requirements 2026 (ConsentPixel)](https://consentpixel.com/blogs/gdpr-cookie-consent-requirements/)
- [SEBI (Investment Advisers) Regulations, 2013, last amended December 2024](https://www.sebi.gov.in/legal/regulations/dec-2024/securities-and-exchange-board-of-india-investment-advisers-regulations-2013-last-amended-on-december-16-2024-_90151.html)
- [SEBI guidelines for investment advisers](https://www.sebi.gov.in/legal/circulars/sep-2020/guidelines-for-investment-advisers_47640.html)
- [Email laws in India 2026, DPDP guide (Signal Plug)](https://signalplug.com/blog/email-laws-india)
