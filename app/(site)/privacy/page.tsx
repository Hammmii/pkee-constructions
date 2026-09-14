import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LegalSection } from "@/components/legal/LegalSection";
import { SpecRow } from "@/components/ui/SpecRow";
import { buildMetadata } from "@/lib/seo/metadata";
import { site, whatsappLink } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Privacy Policy",
    description:
      "How PKEE Constructions collects, uses, and protects the information you share through quote requests, consultation bookings, and contact forms.",
    path: "/privacy",
  });
}

const LAST_UPDATED = "September 14, 2026";

const DATA_COLLECTED: Array<[string, string]> = [
  [
    "Identity & contact",
    "Name, phone number, email address, and — for trade applications — business name and role.",
  ],
  [
    "Project details",
    "Project type, location, timelines, budget range, product interests, and the free-text notes you choose to include.",
  ],
  [
    "Reference images",
    "Photos or inspiration images you upload with a quote or consultation request.",
  ],
  [
    "Technical data",
    "Basic server logs (IP address, browser type) needed to operate and secure the website.",
  ],
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      updated={LAST_UPDATED}
      intro={
        <>
          This policy explains what information {site.legalName} collects through this website, why
          we collect it, and how you can ask us to access or delete it. This site exists to help you
          request quotes, book consultations, and apply to our trade program — we collect only what
          we need to respond to those requests.
        </>
      }
    >
      <section className="mx-auto w-full max-w-3xl px-6 pb-14 md:px-10">
        <h2 className="text-label text-ink/55">What we collect, at a glance</h2>
        <dl className="mt-4">
          {DATA_COLLECTED.map(([label, value]) => (
            <SpecRow key={label} label={label} value={value} />
          ))}
        </dl>
      </section>

      <LegalSection title="How we use your information">
        <p>
          We use form submissions to respond to your inquiry — preparing a quote, arranging a
          consultation or site survey, or reviewing a trade application. We may follow up by phone,
          email, or WhatsApp (our primary quick-contact channel) using the details you provided.
        </p>
        <p>
          We do not use your information for unrelated marketing, and we do not build advertising
          profiles from it.
        </p>
      </LegalSection>

      <LegalSection title="WhatsApp">
        <p>
          Our quote confirmations and follow-ups may come through WhatsApp Business on our showroom
          number ({site.whatsapp.display}). Messaging us on WhatsApp is optional — you can always
          reach us by phone or email instead.
        </p>
      </LegalSection>

      <LegalSection title="Where your data is stored">
        <p>
          Form submissions are stored in our content management system (Payload CMS) hosted on
          Supabase (PostgreSQL). Reference images you upload are stored alongside your submission.
          Access to this data is limited to the {site.name} team members who respond to inquiries.
        </p>
      </LegalSection>

      <LegalSection title="Analytics & cookies">
        <p>
          Analytics on this site are environment-gated and are currently turned off. If enabled in
          the future, they will be aggregate, privacy-respecting usage statistics only.
        </p>
        <p>
          When spam protection (Cloudflare Turnstile) is enabled on a form, Turnstile may set a
          short-lived cookie or use browser signals to verify that the submission is from a human.
          Otherwise, this site does not set tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          We keep quote and consultation submissions for as long as needed to handle your request
          and maintain our business records, after which they are deleted. Reference images are
          removed with the associated submission.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You may request a copy of the personal information we hold about you, or ask us to correct
          or delete it, at any time. Contact us via{" "}
          <a
            href={whatsappLink("Hi PKEE — I'd like to make a privacy request regarding my data.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brass underline-offset-4 hover:underline"
          >
            WhatsApp
          </a>{" "}
          or by email at{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-brass underline-offset-4 hover:underline"
          >
            {site.email}
          </a>
          . We will respond within a reasonable timeframe.
        </p>
      </LegalSection>

      <LegalSection title="What we never do">
        <p>
          We do not sell your personal information, and we do not share it with third parties for
          their own marketing. Data is shared only with the service providers that operate this
          website (hosting and database) under their own privacy obligations.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If we change how we handle personal information, we will update this page and the
          &ldquo;last updated&rdquo; date above. This policy is a working draft and will be reviewed
          by legal counsel before launch.
        </p>
      </LegalSection>

      <section className="border-t rule">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10">
          <h2 className="text-label text-ink/55">Questions</h2>
          <p className="mt-4 text-foreground/80">
            Reach the showroom at {site.address.street}, {site.address.city},{" "}
            {site.address.province}, by phone at {site.phone.display}, or by email at {site.email}.
          </p>
        </div>
      </section>
    </LegalPageShell>
  );
}
