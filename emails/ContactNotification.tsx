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
import type { ContactSummaryRow } from "./ContactConfirmation";

type ContactNotificationEmailProps = {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  rows: ContactSummaryRow[];
  /** Absolute URL into the Payload contact-message document. */
  adminUrl: string;
};

const ink = "#14120F";
const bone = "#F2EDE4";
const brass = "#B08D57";
const stone = "#D9D2C4";
const clay = "#8C5B3F";

/**
 * Internal notification for the showroom/sales team — full summary and a
 * deep link into the Payload contact-messages collection.
 */
export function ContactNotificationEmail({
  name,
  email,
  phone,
  subject,
  rows,
  adminUrl,
}: ContactNotificationEmailProps): ReactElement {
  return (
    <Html lang="en-CA">
      <Head />
      <Preview>
        New contact message — {contactSubjectLabel(subject)} from {name}
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
              New contact message — website
            </Text>
            <Text style={{ color: ink, fontSize: 24, lineHeight: 1.2, margin: "16px 0 0" }}>
              {contactSubjectLabel(subject)}
            </Text>
            <Text style={{ color: ink, fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
              <strong>{name}</strong>
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
              Open the message in Payload:{" "}
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

export default ContactNotificationEmail;
