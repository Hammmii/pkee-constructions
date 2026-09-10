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
import type { QuoteSummaryRow } from "./QuoteConfirmation";

type QuoteNotificationEmailProps = {
  reference: string;
  name: string;
  email: string;
  phone?: string | null;
  leadScore: number;
  rows: QuoteSummaryRow[];
  /** Absolute URL into the Payload admin quote document. */
  adminUrl: string;
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

function scoreTone(score: number): string {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cool";
}

/**
 * Internal notification for the sales team — full summary, intake score with
 * tone, and a deep link into the Payload pipeline.
 */
export function QuoteNotificationEmail({
  reference,
  name,
  email,
  phone,
  leadScore,
  rows,
  adminUrl,
}: QuoteNotificationEmailProps): ReactElement {
  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        New quote request {reference} — score {String(leadScore)}/100 ({scoreTone(leadScore)})
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
              New quote request — website
            </Text>
            <Text style={{ color: ink, fontSize: 24, lineHeight: 1.2, margin: "16px 0 0" }}>
              {reference}
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
              <strong>{name}</strong>
              {phone ? ` · ${phone}` : ""}
              <br />
              <Link href={`mailto:${email}`} style={{ color: ink }}>
                {email}
              </Link>
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 15,
                margin: "20px 0 0",
                padding: "12px 16px",
                border: `1px solid ${brass}`,
                display: "inline-block",
              }}
            >
              Lead score: {leadScore}/100 — {scoreTone(leadScore)}
            </Text>
          </Section>

          {rows.length > 0 && (
            <>
              <Hr style={{ borderColor: stone, margin: "28px 0" }} />
              <Section>
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

          <Hr style={{ borderColor: stone, margin: "28px 0" }} />

          <Section>
            <Text style={{ color: ink, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Open the lead in the Payload pipeline:{" "}
              <Link href={adminUrl} style={{ color: ink }}>
                {adminUrl}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default QuoteNotificationEmail;
