import {
  Button,
  Column,
  Heading,
  Hr,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { colors, EmailLayout, SITE } from "./components/layout";

/**
 * Sent the moment someone joins the waitlist. Structure mirrors the landing
 * page: green "early access" eyebrow, a plain-English promise, then the same
 * before / after example the site closes with, so the first email already
 * shows what the product actually does.
 */

const PREVIEW = "Your spot is saved. Here is what lands in your inbox each morning.";

export function WaitlistConfirmationEmail() {
  return (
    <EmailLayout preview={PREVIEW}>
      <Text style={eyebrow}>EARLY ACCESS</Text>

      <Heading style={heading}>You&apos;re on the list.</Heading>

      <Text style={lead}>
        Thanks for joining the Finlio waitlist. Your spot is saved, and we will
        email you the moment early access opens.
      </Text>

      <Text style={paragraph}>
        Every market morning, Finlio sends you one short message. It explains
        why the stocks and mutual funds you own may go up or down that day, in
        plain English rather than share market jargon.
      </Text>

      <Hr style={rule} />

      {/* The same news, two ways: the concept comparison from the site. */}
      <Text style={exampleLabel}>THE SAME NEWS, TWO WAYS</Text>

      <Section style={beforeCard}>
        <Text style={beforeLabel}>What you read elsewhere</Text>
        <Text style={beforeQuote}>
          &ldquo;TCS Q3 net profit up 8.3% YoY, beats street estimates on robust
          BFSI demand.&rdquo;
        </Text>
      </Section>

      <Section style={afterCard}>
        <Row>
          <Column>
            <Text style={afterLabel}>What Finlio tells you</Text>
          </Column>
          <Column style={changeCell}>
            <Text style={change}>+1.8%</Text>
          </Column>
        </Row>
        <Text style={afterCopy}>
          TCS earned more than expected last quarter. Your TCS shares could go
          up today.
        </Text>
      </Section>

      <Text style={disclaimer}>
        Example only. Finlio is not investment advice.
      </Text>

      <Section style={ctaWrap}>
        <Button href={`${SITE}/#about`} style={cta}>
          See how Finlio works
        </Button>
      </Section>

      <Text style={signoff}>
        Talk soon,
        <br />
        The Finlio team
      </Text>
    </EmailLayout>
  );
}

export default WaitlistConfirmationEmail;

const eyebrow = {
  margin: "0 0 10px",
  fontSize: "12px",
  lineHeight: "16px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  color: colors.green,
};

const heading = {
  margin: "0 0 14px",
  fontSize: "26px",
  lineHeight: "32px",
  fontWeight: 600,
  letterSpacing: "-0.03em",
  color: colors.ink,
};

const lead = {
  margin: "0 0 14px",
  fontSize: "16px",
  lineHeight: "25px",
  letterSpacing: "-0.011em",
  color: colors.ink,
};

const paragraph = {
  margin: "0 0 4px",
  fontSize: "15px",
  lineHeight: "24px",
  letterSpacing: "-0.011em",
  color: colors.body,
};

const rule = {
  borderColor: colors.line,
  margin: "24px 0 20px",
};

const exampleLabel = {
  margin: "0 0 12px",
  fontSize: "11px",
  lineHeight: "16px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: colors.muted,
};

const beforeCard = {
  backgroundColor: colors.cream,
  border: `1px solid ${colors.line}`,
  borderRadius: "14px",
  padding: "16px",
};

const beforeLabel = {
  margin: "0 0 6px",
  fontSize: "11px",
  lineHeight: "16px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: colors.muted,
};

const beforeQuote = {
  margin: "0",
  fontSize: "14px",
  lineHeight: "21px",
  color: colors.body,
};

const afterCard = {
  backgroundColor: "#f2fbf4",
  border: "1px solid #c6ecd0",
  borderRadius: "14px",
  padding: "16px",
  marginTop: "10px",
};

const afterLabel = {
  margin: "0",
  fontSize: "11px",
  lineHeight: "16px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#1f9d47",
};

const changeCell = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
};

const change = {
  margin: "0",
  fontSize: "13px",
  lineHeight: "16px",
  fontWeight: 600,
  color: "#1f9d47",
};

const afterCopy = {
  margin: "8px 0 0",
  fontSize: "15px",
  lineHeight: "23px",
  fontWeight: 500,
  letterSpacing: "-0.011em",
  color: colors.ink,
};

const disclaimer = {
  margin: "12px 0 0",
  fontSize: "12px",
  lineHeight: "18px",
  color: colors.muted,
};

const ctaWrap = {
  padding: "24px 0 8px",
};

const cta = {
  backgroundColor: colors.btn,
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 500,
  letterSpacing: "-0.011em",
  textDecoration: "none",
  padding: "13px 24px",
};

const signoff = {
  margin: "16px 0 0",
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.body,
};
