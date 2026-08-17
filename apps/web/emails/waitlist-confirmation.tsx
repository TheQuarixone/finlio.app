import { Heading, Text } from "@react-email/components";
import { colors, EmailLayout } from "./components/layout";

const PREVIEW = "You're on the Finlio waitlist — here's what happens next.";

export function WaitlistConfirmationEmail() {
  return (
    <EmailLayout preview={PREVIEW}>
      <Heading style={heading}>You&apos;re on the list.</Heading>

      <Text style={paragraph}>
        Thanks for joining the Finlio waitlist. We&apos;ll email you the moment
        the app is ready.
      </Text>

      <Text style={paragraph}>
        Every market morning, Finlio sends you one short message explaining why
        the stocks and mutual funds you own may go up or down that day — in plain
        English, not share-market jargon.
      </Text>

      <Text style={signoff}>— The Finlio team</Text>
    </EmailLayout>
  );
}

export default WaitlistConfirmationEmail;

const heading = {
  margin: "0 0 16px",
  fontSize: "22px",
  lineHeight: "28px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: colors.ink,
};

const paragraph = {
  margin: "0 0 16px",
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.body,
};

const signoff = {
  margin: "8px 0 0",
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.body,
};
