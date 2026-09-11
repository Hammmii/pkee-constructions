import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackClick } from "@/components/analytics/TrackClick";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectBeforeAfter } from "@/components/projects/ProjectBeforeAfter";
import { SolutionAccordion } from "@/components/solutions/SolutionAccordion";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { getPayloadCached } from "@/lib/payload";
import { JsonLd } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Faq, Media, Product, ProductCategory, Project, Solution } from "@/payload-types";

type SolutionDoc = Solution & {
  heroImage?: Media | null;
  recommendedProducts?: (number | Product)[] | null;
  faqs?: (number | Faq)[] | null;
};

type ProductWithCategory = Product & { category: ProductCategory };

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const revalidate = 300;

export async function generateStaticParams() {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "solutions",
    where: { _status: { equals: "published" } },
    limit: 0,
  });
  return (docs as Solution[]).map((solution) => ({ slug: solution.slug }));
}

async function findSolution(slug: string): Promise<SolutionDoc | null> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "solutions",
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
    },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  });
  return (docs[0] as SolutionDoc | undefined) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const solution = await findSolution(slug);
  if (!solution) return {};
  return buildMetadata({
    title: solution.seo?.metaTitle ?? solution.name,
    description:
      solution.seo?.metaDescription ??
      solution.intro ??
      `${solution.name} — PKEE Constructions, Winnipeg.`,
    path: `/solutions/${solution.slug}`,
    image:
      typeof solution.seo?.ogImage === "object" && solution.seo.ogImage?.url
        ? solution.seo.ogImage.url
        : typeof solution.heroImage === "object" && solution.heroImage?.url
          ? solution.heroImage.url
          : undefined,
  });
}

export default async function SolutionPage({ params }: Params) {
  const { slug } = await params;
  const solution = await findSolution(slug);
  if (!solution) notFound();

  const payload = await getPayloadCached();
  const hero = solution.heroImage as Media | null;

  const recommended = (solution.recommendedProducts ?? [])
    .map((p): ProductWithCategory | null => {
      if (typeof p !== "object" || p === null) return null;
      const { category } = p;
      if (typeof category !== "object" || category === null) return null;
      return { ...p, category };
    })
    .filter((p): p is ProductWithCategory => p !== null);

  const { docs: projectDocs } = await payload.find({
    collection: "projects",
    where: {
      and: [{ _status: { equals: "published" } }, { room: { contains: slug } }],
    },
    limit: 4,
    depth: 1,
    overrideAccess: false,
  });
  const projects = (projectDocs ?? []) as Project[];

  const faqs = (solution.faqs ?? []).filter((f): f is Faq => typeof f === "object" && f !== null);

  const firstProduct = recommended[0];
  const quoteHref = firstProduct?.slug ? `/quote?product=${firstProduct.slug}` : "/quote";

  const beforeAfterProject = projects.find((project) => {
    const { beforeImage, afterImage } = project;
    return (
      typeof beforeImage === "object" &&
      beforeImage?.url &&
      typeof afterImage === "object" &&
      afterImage?.url
    );
  });

  return (
    <>
      {faqs.length ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }}
        />
      ) : null}

      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-ink text-bone">
        {hero?.url ? (
          <div className="absolute inset-0">
            <Image
              src={hero.url}
              alt={hero.alt ?? solution.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
          </div>
        ) : null}
        <Container className="relative py-24 md:py-36">
          <p className="text-label uppercase text-brass">Solutions</p>
          <Reveal
            as="h1"
            className="mt-4 text-4xl font-medium tracking-tight text-balance md:text-6xl"
          >
            {solution.name.split(" ").length > 1 ? (
              <>
                {solution.name.split(" ").slice(0, -1).join(" ")}{" "}
                <em className="font-serif italic">{solution.name.split(" ").slice(-1)[0]}</em>
              </>
            ) : (
              <em className="font-serif italic">{solution.name}</em>
            )}
          </Reveal>
          {solution.intro ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--bone-on-ink)]">
              {solution.intro}
            </p>
          ) : null}
        </Container>
      </section>

      {/* Recommended materials */}
      {recommended.length ? (
        <section aria-labelledby="recommended-materials">
          <Container className="py-16 md:py-24">
            <Reveal as="h2" className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Recommended <em className="font-serif italic">materials.</em>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 md:mt-14">
              {recommended.map((product) => {
                const image = product.heroImage as Media | null;
                const category = product.category;
                const href = `/products/${category.slug}/${product.slug}`;
                return (
                  <Link key={product.id} href={href} className="group block">
                    <ImageReveal className="aspect-[4/5]">
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt ?? product.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : null}
                    </ImageReveal>
                    <div className="mt-4 border-t border-brass/50 pt-4">
                      <Chip className="mb-3">{category.name}</Chip>
                      <p className="text-base font-medium tracking-tight text-ink">
                        {product.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Projects in this space */}
      {projects.length ? (
        <section aria-labelledby="projects-in-space">
          <Container className="py-16 md:py-24">
            <Reveal as="h2" className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Projects in this <em className="font-serif italic">space.</em>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 md:mt-14">
              {projects.map((project) => {
                const image = project.heroImage as Media | null;
                return (
                  <Link key={project.id} href={`/projects/${project.slug}`} className="group block">
                    <ImageReveal className="aspect-[4/5]">
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt ?? project.title}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : null}
                    </ImageReveal>
                    <div className="mt-4 border-t border-brass/50 pt-4">
                      <p className="text-base font-medium tracking-tight text-ink">
                        {project.title}
                      </p>
                      {project.location ? (
                        <p className="mt-1 text-sm text-ink/55">{project.location}</p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Before & after (skipped when no project in this space has a pair) */}
      {beforeAfterProject ? (
        <ProjectBeforeAfter
          project={{
            title: beforeAfterProject.title,
            slug: beforeAfterProject.slug,
            location: beforeAfterProject.location,
            beforeImage:
              typeof beforeAfterProject.beforeImage === "object"
                ? beforeAfterProject.beforeImage
                : null,
            afterImage:
              typeof beforeAfterProject.afterImage === "object"
                ? beforeAfterProject.afterImage
                : null,
          }}
        />
      ) : null}

      {/* Get this look */}
      <section aria-labelledby="get-this-look">
        <Container className="py-16 md:py-24">
          <div className="border border-[color:var(--line-on-dark)] bg-ink px-6 py-14 text-center md:px-12 md:py-20">
            <Reveal as="h2" className="text-3xl font-medium tracking-tight text-bone md:text-4xl">
              Get this <em className="font-serif italic">look.</em>
            </Reveal>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[color:var(--bone-dim)]">
              Talk to our team about materials, finishes, and installation for your{" "}
              {solution.name.toLowerCase()} project.
            </p>
            <TrackClick event="get_this_look_click" source={slug} href={quoteHref}>
              <Button href={quoteHref} dark className="mt-8">
                Request a quote
              </Button>
            </TrackClick>
          </div>
        </Container>
      </section>

      {/* FAQs */}
      {faqs.length ? (
        <section aria-labelledby="space-faqs">
          <Container className="py-16 md:py-24">
            <Reveal
              as="h2"
              className="mb-10 text-3xl font-medium tracking-tight text-ink md:mb-14 md:text-4xl"
            >
              Common <em className="font-serif italic">questions.</em>
            </Reveal>
            <SolutionAccordion
              items={faqs.map((f, i) => ({
                id: `faq-${f.id ?? i}`,
                question: f.question,
                answer: f.answer,
              }))}
            />
          </Container>
        </section>
      ) : null}

      {/* Bottom quote CTA */}
      <section aria-labelledby="quote-cta">
        <Container className="pb-24 pt-8 text-center md:pb-32">
          <Reveal as="h2" className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Ready to start your <em className="font-serif italic">project?</em>
          </Reveal>
          <Button href="/quote" variant="ghost" className="mt-8">
            Book a consultation
          </Button>
        </Container>
      </section>
    </>
  );
}
