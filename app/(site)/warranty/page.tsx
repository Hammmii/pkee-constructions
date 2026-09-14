import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LegalSection } from "@/components/legal/LegalSection";
import { SpecRow } from "@/components/ui/SpecRow";
import { buildMetadata } from "@/lib/seo/metadata";
import { site, whatsappLink } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Warranty",
    description:
      "Warranty information for PKEE Constructions installations and the product lines we supply — workmanship coverage, manufacturer warranties, care guidance, and how to make a claim.",
    path: "/warranty",
  });
}

const LAST_UPDATED = "September 14, 2026";

const COVERAGE: Array<[string, string]> = [
  [
    "Workmanship",
    "Placeholder term — TODO-CLIENT: confirm coverage period and scope for our own installation work.",
  ],
  [
    "PVC wall panels",
    "Placeholder — TODO-CLIENT: confirm manufacturer warranty terms (period, finish, delamination coverage) per supplier.",
  ],
  [
    "Decor sheets & boards",
    "Placeholder — TODO-CLIENT: confirm manufacturer warranty terms per supplier.",
  ],
  [
    "Faux stone, louvres & trims",
    "Placeholder — TODO-CLIENT: confirm manufacturer warranty terms per supplier.",
  ],
];

export default function WarrantyPage() {
  return (
    <LegalPageShell
      eyebrow="Warranty"
      title="Warranty"
      updated={LAST_UPDATED}
      intro={
        <>
          What to expect after a {site.legalName} installation — our workmanship coverage, the
          manufacturer warranties that apply to the materials we supply, and how to make a claim.
          This page is a working shell: every coverage term below is a placeholder pending
          confirmation.
        </>
      }
    >
      <section className="mx-auto w-full max-w-3xl px-6 pb-14 md:px-10">
        <h2 className="text-label text-ink/55">Coverage at a glance</h2>
        <dl className="mt-4">
          {COVERAGE.map(([label, value]) => (
            <SpecRow key={label} label={label} value={value} />
          ))}
        </dl>
      </section>

      <LegalSection title="Workmanship warranty">
        <p>
          Installation work performed by our crews is covered by our workmanship warranty.
          <strong className="text-ink"> TODO-CLIENT:</strong> placeholder — confirm the coverage
          period (e.g., one or two years), what is included (e.g., adhesion, alignment, joints and
          trims), and any conditions before this page is published.
        </p>
        <p>
          Workmanship coverage applies to installations completed by {site.legalName}. It does not
          cover damage caused after completion by building movement, moisture intrusion from other
          sources, impact, or modifications made by others.
        </p>
      </LegalSection>

      <LegalSection title="Manufacturer warranties">
        <p>
          The products we supply carry warranties from their manufacturers, which vary by product
          line and application.
          <strong className="text-ink"> TODO-CLIENT:</strong> placeholder — confirm the actual
          manufacturer warranty terms (period, what is covered, claim route, and whether
          installation by us is a condition of coverage) for each product category before launch.
        </p>
        <p>
          Where a manufacturer warranty applies, we will help you understand it and pass your claim
          through to the supplier where required.
        </p>
      </LegalSection>

      <LegalSection title="Care & maintenance">
        <p>
          Proper care keeps panels, sheets, and stone looking right and keeps warranties valid.
          General guidance:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Clean surfaces with a soft cloth and mild, non-abrasive soap solution.</li>
          <li>
            Avoid harsh solvents, abrasive pads, and high-pressure washing on finished surfaces.
          </li>
          <li>Keep wall panels and trims away from sustained, direct high-heat sources.</li>
          <li>
            Address moisture leaks or humidity issues promptly — they are a building issue, not a
            product defect.
          </li>
        </ul>
        <p>
          <strong className="text-ink">TODO-CLIENT:</strong> confirm care instructions against each
          manufacturer&rsquo;s documentation — the list above is generic safe guidance, not final
          product-specific advice.
        </p>
      </LegalSection>

      <LegalSection title="Making a claim">
        <p>
          If something doesn&rsquo;t look right, contact us with your reference number — the quote
          or project reference from your original submission — plus photos of the concern. You can
          reach us on{" "}
          <a
            href={whatsappLink(
              "Hi PKEE — I'd like to ask about a warranty matter. My reference number is: ",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brass underline-offset-4 hover:underline"
          >
            WhatsApp
          </a>{" "}
          or through the contact form. We will review the concern, determine whether it falls under
          workmanship coverage or a manufacturer warranty, and respond with next steps.
        </p>
      </LegalSection>

      <section className="border-t rule">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10">
          <h2 className="text-label text-ink/55">Questions</h2>
          <p className="mt-4 text-foreground/80">
            Warranty questions before you order? Visit us at {site.address.street},{" "}
            {site.address.city}, {site.address.province}, or call {site.phone.display}.
          </p>
        </div>
      </section>
    </LegalPageShell>
  );
}
