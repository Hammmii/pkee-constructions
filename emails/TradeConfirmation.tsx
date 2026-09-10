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

export type TradeSummaryRow = { label: string; value: string };

type TradeConfirmationEmailProps = {
  reference: string;
  name: string;
  rows: TradeSummaryRow[];
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Dealer applicant confirmation — branded (ink/bone/brass), reference up
 * top, summary of what they told us, and the review-time promise.
 */
export function TradeConfirmationEmail({
  reference,
  name,
  rows,
}: TradeConfirmationEmailProps): ReactElement {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        We received your dealer application — reference {reference}. Our trade team reviews new
        applications within 2 business days.
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
              PKEE Constructions — Trade Program
            </Text>
            <Text style={{ color: ink, fontSize: 28, lineHeight: 1.2, margin: "16px 0 0" }}>
              Thank you, {firstName}.
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
              Your dealer application is in. Keep this reference number — our trade team will use
              it in every follow-up.
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 24,
                letterSpacing: 1,
                margin: "24px 0 0",
                padding: "16px 20px",
                border: `1px solid ${brass}`,
                display: "inline-block",
              }}
            >
              {reference}
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
              Our trade team reviews new applications within <strong>2 business days</strong> — we
              may reach out for business documents before approval. If anything about the
              application changes, just reply to this email and reference {reference}.
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
                  Your application, in short
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

export default TradeConfirmationEmail;
