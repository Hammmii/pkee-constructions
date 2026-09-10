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
import type { ConsultationSummaryRow } from "./ConsultationConfirmation";

type ConsultationNotificationEmailProps = {
  reference: string;
  name: string;
  email: string;
  phone?: string | null;
  rows: ConsultationSummaryRow[];
  notes?: string | null;
  /** Absolute URL into the Payload admin consultation document. */
  adminUrl: string;
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Internal notification — booking summary, optional notes, deep link into
 * the Payload consultations pipeline.
 */
export function ConsultationNotificationEmail({
  reference,
  name,
  email,
  phone,
  rows,
  notes,
  adminUrl,
}: ConsultationNotificationEmailProps): ReactElement {
  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        New consultation request {reference} — {name}
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
              PKEE Constructions — New Consultation Request
            </Text>
            <Text style={{ color: ink, fontSize: 28, lineHeight: 1.2, margin: "16px 0 0" }}>
              {reference}
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "16px 0 0" }}>
              {name} · {email}
              {phone ? ` · ${phone}` : ""}
            </Text>
          </Section>

          <Section style={{ marginTop: 24 }}>
            {rows.map((row) => (
              <Text
                key={row.label}
                style={{ color: ink, fontSize: 14, lineHeight: 1.6, margin: "8px 0 0" }}
              >
                <span style={{ color: clay }}>{row.label}: </span>
                {row.value}
              </Text>
            ))}
          </Section>

          {notes ? (
            <Section style={{ marginTop: 24 }}>
              <Text
                style={{
                  color: ink,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Notes
              </Text>
              <Text style={{ color: ink, fontSize: 14, lineHeight: 1.6, margin: "8px 0 0" }}>
                {notes}
              </Text>
            </Section>
          ) : null}

          <Hr style={{ borderColor: stone, margin: "32px 0" }} />

          <Section>
            <Text style={{ margin: 0 }}>
              <Link href={adminUrl} style={{ color: brass, fontSize: 14 }}>
                Open in Payload admin →
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
