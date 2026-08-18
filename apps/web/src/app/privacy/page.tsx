import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { A, Callout, Li, P, T, Table, Ul } from "@/components/legal/prose";
import {
  CONTACT,
  LEGAL_UPDATED,
  RESPONSE_WINDOW,
  legalPage,
} from "@/lib/legal";

const meta = legalPage("/privacy");

export const metadata: Metadata = {
  title: meta.title,
  description:
    "What Finlio collects today (your email address, and nothing else unless you allow it), why, how long we keep it, and how to have it deleted.",
  alternates: { canonical: meta.href },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      meta={meta}
      updated={LEGAL_UPDATED}
      intro={
        <>
          <P>
            Right now Finlio is a waitlist. The only thing we ask you for is an
            email address, and the only thing we do with it is tell you when the
            product is ready.
          </P>
          <P>
            We do not sell your data, we do not run advertising trackers, and we
            do not have your bank or broker anywhere near this site. When the
            product itself arrives, your financial data stays on your own device
            by design, and this page will be updated before that happens, not
            after.
          </P>
        </>
      }
      sections={[
        {
          id: "who-we-are",
          title: "Who is responsible for your data",
          body: (
            <>
              <P>
                Finlio is built by Quarix, in India. For anything you give us
                through this website, we are the <T>data fiduciary</T>: the
                people who decide what is collected and why, and who answer for
                it.
              </P>
              <P>
                You are what the Digital Personal Data Protection Act, 2023
                calls a <T>data principal</T>. Every right described on this
                page is yours, and the way to use any of them is to email{" "}
                <A href={`mailto:${CONTACT.privacy}`}>{CONTACT.privacy}</A>.
              </P>
              <P>
                We follow the DPDP Act and the Digital Personal Data Protection
                Rules, 2025 now. The law gives businesses until 13 May 2027 to
                comply in full. We would rather not build a habit we have to
                unlearn later.
              </P>
            </>
          ),
        },
        {
          id: "scope",
          title: "What this policy covers",
          body: (
            <>
              <P>
                This policy covers <T>finlio.app</T> and the waitlist behind it,
                which is everything Finlio does today. It also covers the email
                we send you as a result.
              </P>
              <P>
                It does not cover the Finlio product, because the product is not
                open yet. Signing in, connecting accounts and the on-device
                store all come with their own commitments, and this page will be
                rewritten to cover them before the first account is created.
              </P>
            </>
          ),
        },
        {
          id: "what-we-collect",
          title: "What we collect",
          body: (
            <>
              <P>
                Itemised, because a list of categories is not much use to
                anyone. This is the whole of it.
              </P>
              <Table
                head={["Data", "When", "Why"]}
                rows={[
                  [
                    "Your email address",
                    "When you join the waitlist",
                    "To email you once, to confirm you are on the list, and again when Finlio opens",
                  ],
                  [
                    "The date and time you joined",
                    "When you join the waitlist",
                    "To keep the list in order and to know when to stop holding an unused entry",
                  ],
                  [
                    "Email delivery events",
                    "When we email you",
                    "Whether a message was delivered, bounced or marked as spam, so we stop sending to a dead or unwilling address",
                  ],
                  [
                    "Anything you write to us",
                    "When you email one of our published addresses",
                    "To answer you. Mail to hello@, privacy@ and grievance@finlio.app is relayed to a mailbox we read",
                  ],
                  [
                    "Standard server logs",
                    "Every page request",
                    "Your IP address, browser and the page requested, kept briefly by our host to serve the site and absorb abuse",
                  ],
                  [
                    "Your cookie choice",
                    "When you answer the cookie banner",
                    "To remember the answer, so we do not ask again or override it",
                  ],
                  [
                    "Anonymous usage statistics",
                    "Only if you allow analytics",
                    "Which parts of the page people read, so we can write a better one. Off unless you turn it on",
                  ],
                ]}
              />
              <Callout>
                <P>
                  We do not ask for your name, your phone number, your PAN, your
                  address, your income, your holdings or anything from your bank
                  or broker. Not on this site. If a page or an email ever asks
                  you for those in Finlio&apos;s name today, it is not us.
                </P>
              </Callout>
            </>
          ),
        },
        {
          id: "consent",
          title: "Consent, and taking it back",
          body: (
            <>
              <P>
                Typing your email into the waitlist form and submitting it is
                your consent for the two things above: the confirmation email
                and the launch email. That is a specific and informed act, which
                is exactly what the DPDP Act requires. Nothing is pre-ticked and
                nothing is bundled.
              </P>
              <P>
                You can withdraw it whenever you like. Today that means one
                email to{" "}
                <A href={`mailto:${CONTACT.privacy}`}>{CONTACT.privacy}</A>{" "}
                asking to come off the list, and we act on it by hand, usually
                the same day. Before we send any product news beyond the
                confirmation, every message will carry a one-click unsubscribe
                link. Withdrawing consent stops the email; ask us to delete the
                entry and the address goes too.
              </P>
              <P>
                Analytics consent is separate, off by default, and changeable at
                any time from the cookie preferences link in the footer.
              </P>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <>
              <P>
                This site sets one cookie of its own, to remember your answer to
                the cookie banner. Nothing else is set unless you allow it, and
                nothing is used for advertising. The full list, with names and
                lifetimes, is in the <A href="/cookies">Cookie Policy</A>.
              </P>
            </>
          ),
        },
        {
          id: "who-we-share-with",
          title: "Who else touches it",
          body: (
            <>
              <P>
                Four suppliers, each doing one job, each processing data only on
                our instructions. We have no others, and we do not sell or rent
                your data to anybody.
              </P>
              <Table
                head={["Supplier", "Job", "What it sees"]}
                rows={[
                  [
                    "Supabase",
                    "The database that holds the waitlist",
                    "Your email address, status and join date",
                  ],
                  [
                    "Resend",
                    "Sending our email, and relaying mail sent to hello@finlio.app",
                    "Your email address, the message, and delivery events",
                  ],
                  [
                    "Vercel",
                    "Hosting and serving the site",
                    "Standard request logs, including your IP address",
                  ],
                  [
                    "PostHog",
                    "Usage statistics, only with your consent",
                    "Anonymous page interactions. Nothing at all until you allow analytics, which is not enabled yet",
                  ],
                ]}
              />
              <P>
                We will also disclose data if the law genuinely requires it, for
                example a valid order from a court or a regulator. If that ever
                happens and we are permitted to tell you, we will.
              </P>
            </>
          ),
        },
        {
          id: "where-it-lives",
          title: "Where your data is stored",
          body: (
            <>
              <P>
                Our database is in a region we choose on Supabase. Email and
                hosting run through Resend and Vercel, which operate
                infrastructure outside India, so your email address is processed
                abroad in the course of being stored and sent.
              </P>
              <P>
                The DPDP Act allows this, except to countries the Central
                Government specifically restricts. If a restriction ever applies
                to a supplier we use, we will move the data rather than argue
                about it.
              </P>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <>
              <Ul>
                <Li>
                  <T>Your waitlist entry</T> stays until Finlio launches and for
                  twelve months after that, so we can invite you and follow up
                  once. After that, an unused entry is deleted.
                </Li>
                <Li>
                  <T>If you unsubscribe or ask us to delete you</T>, we act
                  within {RESPONSE_WINDOW.request} days, and usually the same
                  week.
                </Li>
                <Li>
                  <T>Email you send us</T> is kept as long as the conversation is
                  useful, and no longer.
                </Li>
                <Li>
                  <T>Server logs</T> expire on our host&apos;s short rolling
                  schedule. We do not archive them ourselves.
                </Li>
                <Li>
                  <T>Your cookie choice</T> lasts six months, then we ask again.
                </Li>
              </Ul>
            </>
          ),
        },
        {
          id: "security",
          title: "How we protect it",
          body: (
            <>
              <Ul>
                <Li>
                  Everything travels over TLS. There is no unencrypted path into
                  this site.
                </Li>
                <Li>
                  The waitlist table is protected at the database level, so a
                  browser cannot read the list even if it asks nicely. Writes
                  happen only from our server.
                </Li>
                <Li>
                  Keys and secrets live in our hosting provider&apos;s secret
                  store, never in the code. The code itself is public, which
                  keeps us honest about that.
                </Li>
                <Li>
                  Access to the database is limited to the two people who build
                  Finlio.
                </Li>
              </Ul>
              <P>
                No system is perfect, and we will not pretend otherwise. What we
                can promise is a small amount of data collected, held briefly,
                and reported honestly if something goes wrong.
              </P>
            </>
          ),
        },
        {
          id: "your-rights",
          title: "Your rights",
          body: (
            <>
              <P>Under the DPDP Act you can ask us to:</P>
              <Ul>
                <Li>
                  <T>Show you</T> what we hold about you and who we have shared
                  it with.
                </Li>
                <Li>
                  <T>Correct, complete or update</T> anything that is wrong.
                </Li>
                <Li>
                  <T>Erase</T> it, unless a law requires us to keep it.
                </Li>
                <Li>
                  <T>Withdraw your consent</T>, which stops the email.
                </Li>
                <Li>
                  <T>Nominate</T> someone to exercise these rights for you if
                  you die or cannot act for yourself.
                </Li>
                <Li>
                  <T>Complain</T>, and be answered. See the next section.
                </Li>
              </Ul>
              <P>
                Email <A href={`mailto:${CONTACT.privacy}`}>{CONTACT.privacy}</A>{" "}
                from the address you signed up with, or tell us which address it
                concerns. We reply within {RESPONSE_WINDOW.request} days. We do
                not charge for any of this, and we will not ask you for extra
                personal details to prove who you are beyond what identifies the
                entry.
              </P>
              <P>
                If you are reading this from the EU or the UK, the equivalent
                rights there are ones we honour too. Same email address, same
                answer.
              </P>
            </>
          ),
        },
        {
          id: "grievances",
          title: "Complaints and escalation",
          body: (
            <>
              <P>
                Write to{" "}
                <A href={`mailto:${CONTACT.grievance}`}>{CONTACT.grievance}</A>{" "}
                with &ldquo;Grievance&rdquo; in the subject. We will acknowledge
                it, tell you who is handling it, and resolve it within{" "}
                {RESPONSE_WINDOW.grievance} days, which is the limit the DPDP
                Rules set.
              </P>
              <P>
                If our answer does not satisfy you, you can take the matter to
                the Data Protection Board of India. You do not need our
                permission, and we will not treat it as a hostile act.
              </P>
            </>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: (
            <P>
              Finlio is for adults. The waitlist is meant for people aged 18 and
              over, and we do not knowingly collect anything from a child. If
              you believe a child has joined the list, tell us and we will delete
              the entry. When Finlio does open, any account belonging to a child
              would need verifiable consent from a parent or guardian, and we
              will never profile or advertise to children.
            </P>
          ),
        },
        {
          id: "breaches",
          title: "If something goes wrong",
          body: (
            <P>
              If your data is exposed, we will tell you directly, in plain words,
              with what happened and what to do about it. We will also report it
              to the Data Protection Board of India without delay and file the
              detailed report within 72 hours, as the DPDP Rules require. We
              will not quietly sit on a breach.
            </P>
          ),
        },
        {
          id: "what-we-never-do",
          title: "What we never do",
          body: (
            <Ul>
              <Li>Sell, rent or trade your data. There is no version of Finlio where your data is the product.</Li>
              <Li>Add you to a list you did not join, or buy a list you are on.</Li>
              <Li>Run advertising or cross-site tracking pixels.</Li>
              <Li>
                Ask for your bank or broker password. When Finlio does connect to
                your accounts, it will be through India&apos;s Account
                Aggregator framework, where you approve access in your own
                bank&apos;s app and we receive a revocable token, never your
                credentials.
              </Li>
            </Ul>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <P>
              When this policy changes materially, we will change the date at the
              top and, if the change affects what we collect or why, email
              everyone on the waitlist before it takes effect. Older versions are
              in the public commit history of this site, so you can see exactly
              what changed and when.
            </P>
          ),
        },
      ]}
    />
  );
}
