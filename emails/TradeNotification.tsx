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
import type { TradeSummaryRow } from "./TradeConfirmation";

type TradeNotificationEmailProps = {
  reference: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  rows: TradeSummaryRow[];
  /** Absolute URL into the Payload admin dealer application document. */
  adminUrl: string;
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Internal notification for the trade/sales team — full summary and a deep
 * link into the Payload dealer pipeline.
 */
export function TradeNotificationEmail({
  reference,
  name,
  company,
  email,
  phone,
  rows,
  adminUrl,
}: TradeNotificationEmailProps): ReactElement {
  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        New dealer application {reference} — {company}
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
              New dealer application — website
            </Text>
            <Text style={{ color: ink, fontSize: 24, lineHeight: 1.2, margin: "16px 0 0" }}>
              {reference}
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
              <strong>{company}</strong>
              <br />
              {name}
              {phone ? ` · ${phone}` : ""}
              <br />
              <Link href={`mailto:${email}`} style={{ color: ink }}>
                {email}
              </Link>
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
              Open the application in the Payload pipeline:{" "}
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

export default TradeNotificationEmail;
