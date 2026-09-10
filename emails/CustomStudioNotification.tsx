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

type CustomStudioNotificationEmailProps = {
  name: string;
  email: string;
  phone?: string;
  brief: string;
  attachmentCount: number;
  adminUrl: string;
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/** Internal heads-up for the sales/design team — full brief, admin deep-link. */
export function CustomStudioNotificationEmail({
  name,
  email,
  phone,
  brief,
  attachmentCount,
  adminUrl,
}: CustomStudioNotificationEmailProps): ReactElement {
  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        {`New Custom Studio request from ${name} — ${attachmentCount} reference file(s).`}
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
            <Text style={{ color: ink, fontSize: 24, lineHeight: 1.2, margin: "16px 0 0" }}>
              New Custom Studio request
            </Text>
            <Text style={{ color: ink, fontSize: 14, lineHeight: 1.6, margin: "12px 0 0" }}>
              <strong>{name}</strong>
              <br />
              {email}
              {phone ? (
                <>
                  <br />
                  {phone}
                </>
              ) : null}
            </Text>
            <Text style={{ color: ink, fontSize: 14, lineHeight: 1.6, margin: "12px 0 0" }}>
              Reference files uploaded: <strong>{attachmentCount}</strong>
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
              Full brief (stored on the Consultations record)
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 13,
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {brief}
            </Text>
          </Section>

          <Hr style={{ borderColor: stone, margin: "32px 0" }} />

          <Section>
            <Link
              href={adminUrl}
              style={{
                color: ink,
                fontSize: 13,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Open the record in Payload →
            </Link>
            <Text style={{ color: clay, fontSize: 12, lineHeight: 1.6, margin: "12px 0 0" }}>
              PKEE Constructions · 360 Keewatin St, Winnipeg, MB
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default CustomStudioNotificationEmail;
