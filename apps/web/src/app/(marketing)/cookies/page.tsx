import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { A, Callout, Li, P, T, Table, Ul } from "@/components/legal/prose";
import { CONSENT_COOKIE } from "@/lib/consent";
import { CONTACT, LEGAL_UPDATED, legalPage } from "@/lib/legal";

const meta = legalPage("/cookies");

export const metadata: Metadata = {
  title: meta.title,
  description:
    "Finlio sets one cookie, to remember your consent choice. Analytics cookies stay off until you allow them, and we never use cookies for advertising.",
  alternates: { canonical: meta.href },
};

export default function CookiesPage() {
  return (
    <LegalPage
      meta={meta}
      updated={LEGAL_UPDATED}
      intro={
        <>
          <P>
            One cookie, and it exists to remember that you told us what you want.
            Analytics is off until you switch it on. There are no advertising
            cookies on this site and no third-party trackers riding along.
          </P>
          <P>
            You can change your answer at any time from the cookie preferences
            link in the footer of every page.
          </P>
        </>
      }
      sections={[
        {
          id: "what-cookies-are",
          title: "What a cookie is, briefly",
          body: (
            <P>
              A cookie is a small file a site asks your browser to keep, so
              something can be remembered between page loads. Some are needed for
              a site to function at all. Others watch what you do. The law treats
              those two very differently, and so do we: the second kind requires
              your permission first, given by a clear action, never assumed from
              silence.
            </P>
          ),
        },
        {
          id: "what-we-set",
          title: "Every cookie this site can set",
          body: (
            <>
              <Table
                head={["Name", "Set by", "Purpose", "Lasts"]}
                rows={[
                  [
                    CONSENT_COOKIE,
                    "Finlio (first party)",
                    "Stores your answer to the cookie banner, so we do not ask again and never override it. Essential, and set only once you answer",
                    "6 months",
                  ],
                  [
                    "ph_…_posthog",
                    "PostHog, only with your consent",
                    "Counts page views and repeat visits so we can tell which parts of the page are read. Not enabled on this site yet, and never set unless you allow analytics",
                    "Up to 12 months",
                  ],
                ]}
              />
              <Callout>
                <P>
                  That is the complete list. This site loads no advertising
                  pixels, no social media buttons, no embedded video and no
                  third-party fonts: the typefaces are served from our own domain,
                  so reading this page does not tell anyone else that you were
                  here.
                </P>
              </Callout>
            </>
          ),
        },
        {
          id: "categories",
          title: "The two categories",
          body: (
            <>
              <Ul>
                <Li>
                  <T>Essential.</T> Cannot be switched off, because switching them
                  off would mean forgetting your own preferences and losing the
                  ability to keep the site secure. Today this is one cookie.
                </Li>
                <Li>
                  <T>Analytics.</T> Off by default. Anonymous, aggregated counts of
                  how the page is used, so we can write a clearer page. No
                  profiles, no selling, no sharing with advertisers.
                </Li>
              </Ul>
              <P>
                There is no third category. If we ever need one, the banner will
                ask you again rather than quietly extending what you already
                agreed to.
              </P>
            </>
          ),
        },
        {
          id: "changing-your-mind",
          title: "Changing your answer",
          body: (
            <>
              <P>
                Use the <T>cookie preferences</T> link in the footer of any page.
                It reopens the banner with your current choices, and saving takes
                effect immediately. Withdrawing consent is exactly as easy as
                giving it, which is the point.
              </P>
              <P>
                You can also clear cookies in your browser settings, which erases
                your saved answer and means the banner will ask you again on your
                next visit. Blocking all cookies for this site works too, and
                nothing on the site will break if you do.
              </P>
            </>
          ),
        },
        {
          id: "refusing",
          title: "If you refuse everything",
          body: (
            <P>
              The site works exactly the same. You can read every page and join the
              waitlist with analytics switched off. We do not gate content behind
              consent, re-ask on every page load, or make the reject button harder
              to find than the accept one.
            </P>
          ),
        },
        {
          id: "signals",
          title: "Do Not Track and Global Privacy Control",
          body: (
            <P>
              If your browser sends a Do Not Track or Global Privacy Control
              signal, treat our answer as already given: analytics stays off for
              you. Since analytics is off by default for everyone, honouring the
              signal costs us nothing and is simply the correct default.
            </P>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <P>
              If we add a cookie, this table changes before the cookie ships, and
              the consent banner asks everyone again. Questions about any of it go
              to <A href={`mailto:${CONTACT.privacy}`}>{CONTACT.privacy}</A>. The{" "}
              <A href="/privacy">Privacy Policy</A> covers what happens to the data
              behind these cookies.
            </P>
          ),
        },
      ]}
    />
  );
}
