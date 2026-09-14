import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/catalog/FaqAccordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPayloadCached } from "@/lib/payload";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "FAQ",
    description:
      "Answers on PKEE materials, pricing, samples, lead times, installation, delivery, and the trade program — from the Winnipeg showroom team.",
    path: "/faq",
  });
}

/** Category select options from collections/FAQs.ts, in display order. */
const FAQ_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "pvc-wall-panels", label: "PVC Wall Panels" },
  { value: "decor-sheets", label: "Decor Sheets" },
  { value: "stone", label: "Stone" },
  { value: "walls-backdrops", label: "Walls & Backdrops" },
  { value: "custom-fabrication", label: "Custom Fabrication" },
  { value: "finishing-light", label: "Finishing & Light" },
  { value: "shipping-installation", label: "Shipping & Installation" },
  { value: "trade-program", label: "Trade Program" },
  { value: "general", label: "General" },
];

type FaqDoc = {
  id: string | number;
  question: string;
  answer: string;
  category?: string | null;
};

export default async function FaqPage() {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "faqs",
    where: { _status: { equals: "published" } },
    limit: 0,
    sort: "question",
    depth: 0,
  });

  const faqs = docs as FaqDoc[];
  const groups = FAQ_CATEGORIES.map((category) => ({
    ...category,
    items: faqs.filter((faq) => (faq.category ?? "general") === category.value),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex-1">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
        ]}
      />

      <Container className="pt-28 pb-16 md:pt-36 md:pb-20">
        <SectionHeading index="?" label="Good questions">
          Frequently <em className="font-accent italic">asked.</em>
        </SectionHeading>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/65">
          Straight answers on materials, pricing, samples, lead times, installation, and delivery —
          from the team at the {site.address.city} showroom. Anything else,{" "}
          <Link href="/contact" className="text-brass underline-offset-4 hover:underline">
            contact us
          </Link>
          .
        </p>
      </Container>

      {groups.length === 0 ? (
        <Container className="pb-24">
          <div className="border-t rule pt-10">
            <h2 className="text-2xl font-medium tracking-tight text-ink">No questions yet</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/65">
              We are writing answers to the questions showroom visitors ask most. In the meantime,
              send us yours — we reply within one business day.
            </p>
            <Button href="/contact" className="mt-8">
              Ask a question
            </Button>
          </div>
        </Container>
      ) : (
        groups.map((group) => (
          <section key={group.value} className="border-t rule">
            <Container className="py-14 md:py-16">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <p className="text-label text-brass">{group.items.length} answers</p>
                  <h2 className="mt-4 text-3xl font-medium tracking-tight text-ink">
                    {group.label}
                  </h2>
                </div>
                <div className="lg:col-span-8">
                  <FaqAccordion items={group.items} />
                </div>
              </div>
            </Container>
          </section>
        ))
      )}
    </div>
  );
}
