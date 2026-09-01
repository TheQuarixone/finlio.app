import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { A, Callout, Li, P, T, Ul } from "@/components/legal/prose";
import { COMPANY, CONTACT, LEGAL_UPDATED, legalPage } from "@/lib/legal";

const meta = legalPage("/terms");

export const metadata: Metadata = {
  title: meta.title,
  description:
    "The terms for using finlio.app and joining the Finlio waitlist: who may join, what we will and will not send you, and the limits of what we promise.",
  alternates: { canonical: meta.href },
};

const courts = COMPANY.jurisdictionCity
  ? `the courts at ${COMPANY.jurisdictionCity}, India`
  : "the competent courts in India";

export default function TermsPage() {
  return (
    <LegalPage
      meta={meta}
      updated={LEGAL_UPDATED}
      intro={
        <>
          <P>
            You are on a pre-launch website. You can read it and you can join a
            waitlist with your email address. That is the whole of what is on
            offer today, and these terms are sized to match.
          </P>
          <P>
            The two clauses worth reading properly are section 7, which explains
            that Finlio gives information and never investment advice, and
            section 11, which explains the limits of what we are liable for.
          </P>
        </>
      }
      sections={[
        {
          id: "agreement",
          title: "This agreement",
          body: (
            <>
              <P>
                These terms are between you and Quarix, the team that builds
                Finlio. By using <T>finlio.app</T> or joining the waitlist, you
                accept them. If you do not, the answer is simple: do not use the
                site.
              </P>
              <P>
                The <A href="/privacy">Privacy Policy</A>, the{" "}
                <A href="/cookies">Cookie Policy</A> and the{" "}
                <A href="/disclaimer">Financial Disclaimer</A> are part of this
                agreement. Where the Disclaimer says something more specific
                about financial content, it wins.
              </P>
            </>
          ),
        },
        {
          id: "what-finlio-is",
          title: "What Finlio is today",
          body: (
            <>
              <P>
                Today Finlio is a description of a product and a list of people
                who want it. There is no account to sign in to, no dashboard, no
                data to import and nothing to pay for.
              </P>
              <P>
                Everything the site says about what Finlio will do is our current
                intention, not a promise. Features described here may change,
                arrive later than planned, or not arrive at all. Joining the
                waitlist reserves you a place in the queue, not a price, a
                feature, a launch date or a guarantee of access.
              </P>
            </>
          ),
        },
        {
          id: "eligibility",
          title: "Who may use this site",
          body: (
            <>
              <P>
                You must be at least 18 years old and able to enter a contract.
                If you are outside India, including if you are an NRI, you are
                responsible for whether using a service like this is permitted
                where you live. We build for India first, and we do not tailor
                this site to every jurisdiction it can be opened from.
              </P>
            </>
          ),
        },
        {
          id: "waitlist",
          title: "Joining the waitlist",
          body: (
            <>
              <Ul>
                <Li>
                  Use an email address that is yours. Signing someone else up is
                  not a joke we are able to unwind for them.
                </Li>
                <Li>
                  One entry per address. Repeat submissions of the same address
                  change nothing.
                </Li>
                <Li>
                  Do not automate the form, feed it fake addresses, or use it to
                  send anyone else a message.
                </Li>
              </Ul>
              <P>
                We may remove an entry that looks automated, abusive or
                fabricated, and we may remove yours at your request at any time.
              </P>
            </>
          ),
        },
        {
          id: "emails",
          title: "Email we will send you",
          body: (
            <>
              <P>
                Two kinds, and no others: a confirmation when you join, and
                product news, which in practice means we tell you when Finlio
                opens and occasionally what we have built. No advertising for
                anybody else, ever.
              </P>
              <P>
                You can stop them at any time. Product news will carry a
                one-click unsubscribe link, and until then a note to{" "}
                <A href={`mailto:${CONTACT.general}`}>{CONTACT.general}</A>{" "}
                takes you off the list. Either way you do not have to explain
                yourself.
              </P>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "How not to use the site",
          body: (
            <>
              <P>Do not:</P>
              <Ul>
                <Li>
                  Attack the site, probe it for holes without telling us, or try
                  to reach data that is not yours.
                </Li>
                <Li>
                  Scrape it at a rate that costs us money, or resell any part of
                  it as your own.
                </Li>
                <Li>
                  Impersonate Finlio or Quarix, including by copying this site to
                  collect other people&apos;s data or money.
                </Li>
                <Li>
                  Use the site to break Indian law, or the law wherever you are.
                </Li>
              </Ul>
              <Callout>
                <P>
                  Found a security flaw? Please tell us at{" "}
                  <A href={`mailto:${CONTACT.general}`}>{CONTACT.general}</A>{" "}
                  before you tell anyone else. We will not threaten you for
                  reporting something in good faith.
                </P>
              </Callout>
            </>
          ),
        },
        {
          id: "not-advice",
          title: "Finlio is not investment advice",
          body: (
            <>
              <P>
                This is the clause that matters most, so it also has a page of
                its own: the <A href="/disclaimer">Financial Disclaimer</A>.
              </P>
              <P>
                In short: Finlio explains what is happening and why, in plain
                words. It does not tell you what to buy or sell, it is not
                personalised investment advice, and using it creates no adviser
                relationship between us. Quarix is not registered with SEBI as an
                investment adviser or a research analyst. Finlio suggests, it
                never executes: it will never place a trade or move your money.
              </P>
              <P>
                Decisions about your money remain yours. For advice about your
                particular situation, speak to a SEBI-registered investment
                adviser.
              </P>
            </>
          ),
        },
        {
          id: "ip",
          title: "What belongs to whom",
          body: (
            <>
              <P>
                Finlio&apos;s source code is public and licensed under the{" "}
                <T>AGPL-3.0</T>, in the{" "}
                <A href="https://github.com/TheQuarixone/Finlio.app">
                  project repository
                </A>
                . You may use it on those terms, which include sharing your
                changes if you run a modified version as a service.
              </P>
              <P>
                The name Finlio, the logo, the wordmark and the written content of
                this site are not covered by that licence and remain ours. Do not
                use them in a way that suggests we built or endorsed your thing.
              </P>
            </>
          ),
        },
        {
          id: "availability",
          title: "Availability and changes",
          body: (
            <P>
              This is a pre-launch site, run lean. It may go down, change without
              notice, or be taken offline entirely. We do not promise uptime, and
              we may change these terms as the product becomes real. When we
              change them materially we will update the date at the top of this
              page and, where the change affects people already on the waitlist,
              email them.
            </P>
          ),
        },
        {
          id: "warranties",
          title: "What we do not warrant",
          body: (
            <P>
              The site and its content are provided as they are. We do not
              warrant that they are complete, accurate, current, uninterrupted or
              fit for a particular purpose. Market information, examples and
              sample briefs on this site are illustrations, not live data, and
              nothing on it should be treated as a factual statement about any
              security.
            </P>
          ),
        },
        {
          id: "liability",
          title: "Limits on our liability",
          body: (
            <>
              <P>
                To the extent the law allows, we are not liable for indirect or
                consequential loss, lost profits, lost opportunity, or any
                investment loss you incur after reading something on this site.
                Our total liability arising from your use of this site is limited
                to the amount you have paid us for it, which for the waitlist is
                nothing.
              </P>
              <P>
                Nothing here limits liability for fraud, for wilful misconduct, or
                for anything that cannot be limited under Indian law, including
                rights you have as a consumer.
              </P>
            </>
          ),
        },
        {
          id: "indemnity",
          title: "If your use costs us",
          body: (
            <P>
              If you use this site in breach of section 6 and that causes a claim
              against us, you agree to cover the reasonable costs of dealing with
              it. This is aimed at abuse, not at ordinary use or at honest
              disagreement with us.
            </P>
          ),
        },
        {
          id: "suspension",
          title: "Ending it",
          body: (
            <P>
              You can leave at any time by unsubscribing or asking us to delete
              your entry. We may remove your waitlist entry or block access to the
              site if you breach these terms, and we will tell you why if you ask.
            </P>
          ),
        },
        {
          id: "law",
          title: "Governing law",
          body: (
            <P>
              These terms are governed by the laws of India, and {courts} have
              exclusive jurisdiction over any dispute arising from them. Before
              going to court, please email us: almost everything at this stage is
              a misunderstanding that one reply can fix.
            </P>
          ),
        },
      ]}
    />
  );
}
