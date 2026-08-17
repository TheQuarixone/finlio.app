import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared branded shell for every Finlio email. Keeps the logo lockup, colours,
 * and footer identical across templates; individual emails only supply their
 * body. Colours mirror the web design tokens in `src/app/globals.css` and the
 * surfaces mirror the site: cream page, white cards, hairline rules.
 *
 * Everything is inline-styled with table-based primitives (Row / Column /
 * Section) because that is what survives Outlook and Gmail.
 */

const colors = {
  cream: "#fbfaf9",
  card: "#ffffff",
  line: "#ecebe7",
  ink: "#343433",
  body: "#474645",
  muted: "#8a8986",
  blue: "#018dff",
  green: "#34c759",
  btn: "#222222",
} as const;

/**
 * The `www` host on purpose. `finlio.app` answers with a 308 to `www`, and mail
 * is the wrong place for a redirect hop: image proxies do not always follow one,
 * and link scanners score redirects against deliverability. The site keeps
 * `https://finlio.app` as its canonical (see `src/app/layout.tsx`); only the
 * link targets here differ. Displayed text stays "finlio.app".
 */
const SITE = "https://www.finlio.app";

/** Geist is the site face; mail clients get the closest system stack. */
const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export type EmailLayoutProps = {
  /** Hidden inbox preview line (the grey text next to the subject). */
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        {/* The brand mark is dark on white, so keep clients from auto-inverting. */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Row>
              <Column style={markCell}>
                <Img
                  src={`${SITE}/finlio-mark-email.png`}
                  width="32"
                  height="20"
                  alt="Finlio"
                  style={mark}
                />
              </Column>
              <Column style={wordmarkCell}>
                <Text style={wordmark}>Finlio</Text>
              </Column>
            </Row>
          </Section>

          <Section style={card}>{children}</Section>

          <Section style={footer}>
            <Text style={footerText}>
              You are receiving this because you joined the Finlio waitlist.
              Reply any time and a human will answer. Finlio only suggests; it
              never places trades or moves your money, and nothing we send is
              investment advice.
            </Text>

            <Text style={copyright}>&copy; 2026 Finlio</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: colors.cream,
  fontFamily: fontStack,
  margin: "0",
  padding: "32px 0",
};

const container = {
  margin: "0 auto",
  width: "100%",
  maxWidth: "560px",
  padding: "0 20px",
};

const header = {
  padding: "0 4px 20px",
};

/* The mark sits bare next to the wordmark, exactly as it does on the site.
   `finlio-mark-email.png` is the transparent, trimmed cut of the brand mark;
   the source asset (`finlion-mark.png`) has a white background baked in, which
   would show as a pale box on the cream page. */
const markCell = {
  width: "32px",
  verticalAlign: "middle" as const,
};

const mark = {
  display: "block",
};

const wordmarkCell = {
  paddingLeft: "9px",
  verticalAlign: "middle" as const,
};

const wordmark = {
  margin: "0",
  fontSize: "19px",
  lineHeight: "24px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: colors.ink,
};

const card = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.line}`,
  borderRadius: "20px",
  padding: "32px 28px",
};

const footer = {
  padding: "24px 4px 0",
};

const footerText = {
  margin: "0 0 8px",
  fontSize: "12px",
  lineHeight: "18px",
  color: colors.muted,
};

const copyright = {
  margin: "12px 0 0",
  fontSize: "12px",
  lineHeight: "18px",
  color: colors.muted,
};

export { colors, fontStack, SITE };
