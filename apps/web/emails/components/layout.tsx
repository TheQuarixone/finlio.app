import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared branded shell for every Finlio email. Keeps the wordmark, colours,
 * and footer identical across templates — individual emails only supply their
 * body. Colours mirror the web design tokens in `src/app/globals.css`.
 */

const colors = {
  cream: "#fbfaf9",
  card: "#ffffff",
  line: "#ecebe7",
  ink: "#343433",
  body: "#474645",
  muted: "#8a8986",
  blue: "#018dff",
} as const;

export type EmailLayoutProps = {
  /** Hidden inbox preview line (the grey text next to the subject). */
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>Finlio</Text>
          </Section>

          <Section style={card}>{children}</Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Finlio — personal AI finance, made simple.
            </Text>
            <Text style={footer}>
              You are receiving this because you joined the waitlist at{" "}
              <Link href="https://finlio.app" style={footerLink}>
                finlio.app
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: colors.cream,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "24px 0",
};

const container = {
  margin: "0 auto",
  maxWidth: "480px",
  padding: "0 20px",
};

const header = {
  padding: "8px 0 20px",
};

const wordmark = {
  margin: "0",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: colors.ink,
};

const card = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.line}`,
  borderRadius: "16px",
  padding: "28px 24px",
};

const hr = {
  borderColor: colors.line,
  margin: "24px 0 16px",
};

const footer = {
  margin: "0 0 6px",
  fontSize: "12px",
  lineHeight: "18px",
  color: colors.muted,
};

const footerLink = {
  color: colors.blue,
  textDecoration: "none",
};

export { colors };
