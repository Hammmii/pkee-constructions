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

export type SamplesSummaryRow = { label: string; value: string };

type SamplesConfirmationEmailProps = {
  reference: string;
  name: string;
  rows: SamplesSummaryRow[];
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Customer confirmation — branded (ink/bone/brass), reference up top,
 * summary of the requested samples, and the fulfilment promise.
 */
export function SamplesConfirmationEmail({
  reference,
  name,
  rows,
}: SamplesConfirmationEmailProps): ReactElement {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        We received your sample request — reference {reference}. We ship samples within 2 business
        days.
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
              PKEE Constructions — Samples
            </Text>
            <Text style={{ color: ink, fontSize: 28, lineHeight: 1.2, margin: "16px 0 0" }}>
              Thank you, {firstName}.
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "16px 0 0" }}>
              We received your sample request. Your reference number is{" "}
              <strong style={{ color: brass }}>{reference}</strong>.
            </Text>
          </Section>

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
              Your samples
            </Text>
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

          <Hr style={{ borderColor: stone, margin: "32px 0" }} />

          <Section>
            <Text style={{ color: ink, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              A specialist confirms every sample request personally and ships within 2 business
              days. Questions in the meantime? Reply to this email or visit the showroom at 360
              Keewatin St, Winnipeg, MB.
            </Text>
            <Text style={{ color: clay, fontSize: 12, lineHeight: 1.6, margin: "16px 0 0" }}>
              <Link href="https://pkeeconstructions.ca/samples" style={{ color: brass }}>
                pkeeconstructions.ca/samples
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
