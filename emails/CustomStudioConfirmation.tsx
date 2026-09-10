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

export type CustomStudioSummaryRow = { label: string; value: string };

type CustomStudioConfirmationEmailProps = {
  name: string;
  rows: CustomStudioSummaryRow[];
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Custom Studio uploader confirmation — branded (ink/bone/brass), summary of
 * the brief they sent, and the review-time promise. The Consultations
 * collection has no persisted reference column, so no reference token here.
 */
export function CustomStudioConfirmationEmail({
  name,
  rows,
}: CustomStudioConfirmationEmailProps): ReactElement {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        We received your Custom Studio request, {firstName}. Our design team reviews new uploads
        within 2 business days.
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
              PKEE Constructions — Custom Studio
            </Text>
            <Text style={{ color: ink, fontSize: 28, lineHeight: 1.2, margin: "16px 0 0" }}>
              Thank you, {firstName}.
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
              Your design upload is in. Our Custom Studio team is reviewing your brief and reference
              files, and will come back to you with next steps and a quotation.
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
              Our design team reviews new Custom Studio requests within{" "}
              <strong>2 business days</strong> — usually sooner. If we need measurements, material
              samples, or another reference, we will reach out directly. You can also visit the
              showroom at 360 Keewatin St, Winnipeg.
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
                  Your request, in short
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

export default CustomStudioConfirmationEmail;
