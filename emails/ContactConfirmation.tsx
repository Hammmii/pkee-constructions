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
import type { ReactElement } from "react";
import { contactSubjectLabel } from "@/lib/contact";

export type ContactSummaryRow = { label: string; value: string };

type ContactConfirmationEmailProps = {
  name: string;
  subject: string;
  rows: ContactSummaryRow[];
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Contact-form confirmation — branded (ink/bone/brass), mirrors the trade
 * confirmation: thank-you up top, the topic, a summary of the message, and
 * the response-time promise.
 */
export function ContactConfirmationEmail({
  name,
  subject,
  rows,
}: ContactConfirmationEmailProps): ReactElement {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        We received your message — {contactSubjectLabel(subject)}. The showroom team responds within
        one business day.
      </Preview>
      <Body style={{ backgroundColor: bone, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>
          <Section>
            <Text
              style={{
                color: brass,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              PKEE Constructions — Contact
            </Text>
            <Text style={{ color: ink, fontSize: 28, lineHeight: 1.2, margin: "16px 0 0" }}>
              Thank you, {firstName}.
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
              Your message is in — topic: <strong>{contactSubjectLabel(subject)}</strong>. We
              respond to every enquiry within one business day.
            </Text>
          </Section>

          <Hr style={{ borderColor: stone, margin: "32px 0" }} />

          <Section>
            <Text
              style={{
                color: ink,
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              What happens next
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              A person from the Winnipeg showroom team reads every message — no autoresponder loops.
              If it&rsquo;s urgent, call the showroom and mention this email.
            </Text>
          </Section>

          {rows.length > 0 && (
            <>
              <Hr style={{ borderColor: stone, margin: "32px 0" }} />
              <Section>
                <Text
                  style={{
                    color: ink,
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  Your message, in short
                </Text>
                {rows.map((row) => (
                  <Text
                    key={row.label}
                    style={{ color: ink, fontSize: 14, lineHeight: 1.5, margin: "6px 0" }}
                  >
                    <span style={{ color: clay }}>{row.label} — </span>
                    {row.value}
                  </Text>
                ))}
              </Section>
            </>
          )}

          <Hr style={{ borderColor: stone, margin: "32px 0" }} />

          <Section>
            <Text style={{ color: ink, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              PKEE Constructions
              <br />
              360 Keewatin St, Winnipeg, MB
              <br />
              <Link href="mailto:info@pkeeconstructions.ca" style={{ color: ink }}>
                info@pkeeconstructions.ca
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactConfirmationEmail;
