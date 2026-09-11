import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Reveal } from "@/components/motion/Reveal";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { getPayloadCached } from "@/lib/payload";
import { JsonLd } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Media, Product, Solution } from "@/payload-types";

export const dynamic = "force-static";
export const revalidate = 300;

type SolutionDoc = Solution & {
  heroImage?: Media | null;
  recommendedProducts?: (number | Product)[] | null;
};

export const metadata: Metadata = buildMetadata({
  title: "Solutions",
  description:
    "Room-by-room material solutions by PKEE Constructions — decorative wall panels, mouldings, and custom fabrication for every space, supplied and installed across Winnipeg.",
  path: "/solutions",
});

async function listSolutions(): Promise<SolutionDoc[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "solutions",
    where: { _status: { equals: "published" } },
    sort: "name",
    limit: 0,
    depth: 1,
    overrideAccess: false,
  });
  return docs as SolutionDoc[];
}

export default async function SolutionsIndexPage() {
  const solutions = await listSolutions();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: solutions.map((solution, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: solution.name,
            url: `/solutions/${solution.slug}`,
          })),
        }}
      />

      {/* Editorial hero */}
      <section className="bg-ink text-bone">
        <Container className="py-24 md:py-36">
          <p className="text-label uppercase text-brass">Solutions</p>
          <Reveal
            as="h1"
            className="mt-4 text-4xl font-medium tracking-tight text-balance md:text-6xl"
          >
            Every space, <em className="font-serif italic">solved.</em>
          </Reveal>
          <Reveal
            as="p"
            className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--bone-on-ink)]"
          >
            Start with the room, not the material. Each solution pairs the right decorative
            surfaces, mouldings, and fabrication details for that space — then our team supplies and
            installs it end to end.
          </Reveal>
        </Container>
      </section>

      <Container className="py-16 md:py-24">
        {solutions.length === 0 ? (
          <div className="border border-line bg-ink/[0.03] px-8 py-16 text-center">
            <Reveal as="h2" className="font-serif text-3xl text-ink">
              No solutions <em className="font-serif italic">published</em> yet
            </Reveal>
            <p className="mt-4 text-ink/60">
              New spaces are on the way — or{" "}
              <Link href="/quote" className="text-brass underline underline-offset-4">
                ask us directly
              </Link>{" "}
              about your project.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution, i) => {
              const image = solution.heroImage as Media | null;
              const productCount = (solution.recommendedProducts ?? []).filter(
                (p): p is Product => typeof p === "object" && p !== null,
              ).length;
              return (
                <li key={solution.id}>
                  <Link href={`/solutions/${solution.slug}`} className="group block">
                    <ImageReveal className="aspect-[4/5]">
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt ?? solution.name}
                          fill
                          priority={i < 3}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : null}
                    </ImageReveal>
                    <div className="mt-4 border-t border-brass/50 pt-4">
                      {productCount > 0 ? (
                        <Chip className="mb-3">
                          {productCount} {productCount === 1 ? "material" : "materials"}
                        </Chip>
                      ) : null}
                      <p className="text-base font-medium tracking-tight text-ink">
                        {solution.name}
                      </p>
                      {solution.intro ? (
                        <p className="mt-1 line-clamp-2 text-sm text-ink/55">{solution.intro}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
