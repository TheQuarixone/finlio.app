import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { A, Callout, Li, P, T, Ul } from "@/components/legal/prose";
import { CONTACT, LEGAL_UPDATED, legalPage } from "@/lib/legal";

const meta = legalPage("/disclaimer");

export const metadata: Metadata = {
  title: meta.title,
  description:
    "Finlio explains markets in plain words. It is not investment advice, Quarix is not a SEBI-registered adviser, and Finlio never places a trade or moves your money.",
  alternates: { canonical: meta.href },
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      meta={meta}
      updated={LEGAL_UPDATED}
      intro={
        <>
          <P>
            Finlio is built to explain, in plain words, what is happening to the
            money you already have. Explaining is not advising. Finlio will not
            tell you what to buy or sell, and it will never place a trade or move
            a rupee on your behalf.
          </P>
          <P>
            Read section 1 and section 3. Between them they describe the line
            Finlio does not cross.
          </P>
        </>
      }
      sections={[
        {
          id: "information-only",
          title: "Information, not investment advice",
          body: (
            <>
              <P>
                Everything on this site, and everything Finlio will send you, is
                general information and education. It is not investment advice,
                not a recommendation, and not an offer or solicitation to buy or
                sell any security.
              </P>
              <P>
                Nothing Finlio produces takes account of your financial position,
                your goals, your tax situation or your appetite for risk in the
                way a regulated adviser is required to. Do not treat a Finlio
                explanation as a reason on its own to act.
              </P>
              <Callout tone="orange">
                <P>
                  <T>
                    Investments in securities and mutual funds carry market risk.
                  </T>{" "}
                  Read all scheme related documents carefully before investing. Past
                  performance does not predict future returns, and no part of Finlio
                  promises a return of any kind.
                </P>
              </Callout>
            </>
          ),
        },
        {
          id: "not-registered",
          title: "We are not a registered adviser",
          body: (
            <>
              <P>
                Quarix, the team behind Finlio, is <T>not</T> registered with the
                Securities and Exchange Board of India as an investment adviser or
                as a research analyst. We are not a stock broker, a mutual fund
                distributor, a portfolio manager or an insurance intermediary, and
                we are not registered with the Reserve Bank of India or IRDAI.
              </P>
              <P>
                We earn nothing from what you buy or sell. Finlio is paid for by
                the people who use it, not by commission from anyone whose product
                appears in it. If that ever changes, it will be disclosed on this
                page before it happens.
              </P>
              <P>
                For advice about your particular circumstances, speak to a
                SEBI-registered investment adviser. You can verify any adviser&apos;s
                registration on SEBI&apos;s own website before you trust them,
                including anyone who claims to speak for us.
              </P>
            </>
          ),
        },
        {
          id: "suggests-never-executes",
          title: "Finlio suggests, it never executes",
          body: (
            <>
              <P>
                This is a design rule, not a temporary limitation. Finlio has no
                ability to transact:
              </P>
              <Ul>
                <Li>It cannot place, modify or cancel a trade.</Li>
                <Li>It cannot transfer, withdraw or move money.</Li>
                <Li>
                  It will never ask for your bank or broker password. Account
                  access, when it arrives, runs through India&apos;s Account
                  Aggregator framework, where you approve read-only access in your
                  own bank&apos;s app and can revoke it there at any time.
                </Li>
              </Ul>
              <P>
                Anyone contacting you in Finlio&apos;s name to ask for credentials,
                a transfer, or a &ldquo;guaranteed&rdquo; tip is not us. Tell us at{" "}
                <A href={`mailto:${CONTACT.general}`}>{CONTACT.general}</A>.
              </P>
            </>
          ),
        },
        {
          id: "ai-limits",
          title: "Finlio uses AI, and AI gets things wrong",
          body: (
            <>
              <P>
                Finlio&apos;s explanations are generated by language models working
                over market data and your own records. That approach is good at
                turning noise into a readable sentence. It is also capable of being
                confidently wrong: a misread number, a stale price, a plausible
                explanation for something that did not happen.
              </P>
              <P>
                Every AI-generated output carries a disclaimer, and none of it is
                reviewed by a human before it reaches you. Treat it as a starting
                point for your own thinking, verify anything that would change a
                decision, and tell us when it is wrong so we can fix it.
              </P>
            </>
          ),
        },
        {
          id: "data",
          title: "Where the numbers come from",
          body: (
            <P>
              Market prices, fund data and company information come from third-party
              sources. They can be delayed, incomplete, revised or simply
              incorrect, and we do not guarantee their accuracy. Figures shown in
              examples on this site, including any sample morning brief, are
              illustrations rather than live quotes for any security.
            </P>
          ),
        },
        {
          id: "tax",
          title: "Tax and legal information",
          body: (
            <P>
              Anything Finlio says about tax, including sections such as 80C or
              capital gains, is general information current at the time of writing.
              Tax law changes, and it applies differently to different people. It is
              not tax advice or legal advice. For your own position, use a chartered
              accountant or a tax professional.
            </P>
          ),
        },
        {
          id: "your-decision",
          title: "The decisions stay yours",
          body: (
            <P>
              You are responsible for what you do with your money, including
              anything you do after reading something from Finlio. We accept no
              liability for investment losses, missed gains or decisions taken on
              the strength of a Finlio explanation. That limit is set out in section
              11 of the <A href="/terms">Terms of Use</A>.
            </P>
          ),
        },
        {
          id: "outside-india",
          title: "If you are outside India",
          body: (
            <P>
              Finlio is built for Indian investors and for the Indian diaspora, and
              it is written against Indian markets and Indian rules. It is not
              tailored to the securities, tax or advisory rules of any other
              country. If you invest from outside India, including as an NRI, the
              rules where you live apply to you and are your responsibility to
              follow.
            </P>
          ),
        },
      ]}
    />
  );
}
