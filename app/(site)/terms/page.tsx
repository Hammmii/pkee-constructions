import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LegalSection } from "@/components/legal/LegalSection";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Terms of Use",
    description:
      "The terms that govern your use of the PKEE Constructions website, including quote requests, content accuracy, and intellectual property.",
    path: "/terms",
  });
}

const LAST_UPDATED = "September 14, 2026";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms"
      title="Terms of Use"
      updated={LAST_UPDATED}
      intro={
        <>
          These terms govern your use of the {site.legalName} website. By browsing the site or
          submitting a request through it, you agree to the terms below.
        </>
      }
    >
      <LegalSection title="Informational site">
        <p>
          This website presents our catalog of decorative building materials and the services we
          offer from our Winnipeg showroom. It is provided for general information. Nothing on this
          site constitutes professional advice for your specific project — product suitability,
          quantities, and installation requirements should be confirmed with our team.
        </p>
      </LegalSection>

      <LegalSection title="Quotes & pricing">
        <p>
          Quote requests submitted through this site are invitations to do business, not binding
          orders. Any figures discussed are estimates until confirmed in writing. Final pricing is
          always subject to a site survey or project review, and may change with measurements,
          substrate conditions, material selections, and access.
        </p>
        <p>
          Submitting a quote request, consultation booking, or trade application does not create an
          obligation for either party until a written agreement is signed.
        </p>
      </LegalSection>

      <LegalSection title="Content accuracy">
        <p>
          We work to keep product descriptions, specifications, and imagery accurate, but catalog
          details may change as manufacturers update their ranges. Colors and finishes can vary
          between screens and physical samples. Samples and spec sheets are available before you
          commit — confirm details with our team for any project where exactness matters.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The text, imagery, and design of this website are the property of {site.legalName} and may
          not be copied, reproduced, or republished without our written permission. Product names
          and manufacturer marks referenced on this site belong to their respective owners.
        </p>
      </LegalSection>

      <LegalSection title="External links">
        <p>
          This site may link to external websites (for example, manufacturer resources). We are not
          responsible for the content or accuracy of third-party sites, and a link does not imply
          endorsement.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of the Province of Manitoba and the federal laws of
          Canada applicable within it. Any dispute arising from the use of this website will be
          resolved in the courts of Manitoba.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms from time to time. The &ldquo;last updated&rdquo; date at the
          top of this page reflects the most recent revision. These terms are a working draft and
          will be reviewed by legal counsel before launch.
        </p>
      </LegalSection>

      <section className="border-t rule">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10">
          <h2 className="text-label text-ink/55">Contact</h2>
          <p className="mt-4 text-foreground/80">
            Questions about these terms? Reach us at {site.address.street}, {site.address.city},{" "}
            {site.address.province}, by phone at {site.phone.display}, or by email at {site.email}.
          </p>
        </div>
      </section>
    </LegalPageShell>
  );
}
