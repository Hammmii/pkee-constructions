import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPayloadCached } from "@/lib/payload";
import { breadcrumbJsonLd, JsonLd, mediaAbsoluteUrl } from "@/lib/seo/JsonLd";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";
import type { Media, Product, Project } from "@/payload-types";

export const dynamic = "force-static";
export const revalidate = 300;

type PageParams = { slug: string };

function asMedia(value: number | Media | null | undefined): Media | null {
  return typeof value === "object" && value !== null ? value : null;
}

function resolveCategorySlug(product: Product): string | null {
  const category = product.category;
  if (typeof category === "object" && category !== null && "slug" in category) {
    return category.slug;
  }
  return null;
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "projects",
    where: { _status: { equals: "published" } },
    limit: 100,
    depth: 0,
  });
  return docs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "projects",
    where: {
      _status: { equals: "published" },
      slug: { equals: slug },
    },
    limit: 1,
    depth: 1,
  });
  const project = docs[0];
  if (!project) {
    return buildMetadata({ title: "Project not found", description: "", path: "/projects" });
  }
  const image = asMedia(project.heroImage ?? project.afterImage);
  return buildMetadata({
    title: project.title,
    description:
      project.description?.slice(0, 160) ??
      `${project.title} — a ${project.type ?? "residential"} project by PKEE Constructions in ${project.location ?? "Winnipeg"}.`,
    path: `/projects/${project.slug}`,
    image: mediaAbsoluteUrl(image),
  });
}

export default async function ProjectDetailPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const payload = await getPayloadCached();

  const { docs } = await payload.find({
    collection: "projects",
    where: {
      _status: { equals: "published" },
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
  });
  const project = docs[0];
  if (!project) notFound();

  // depth 2 so productsUsed resolve with their category docs
  const products = (project.productsUsed ?? []).filter(
    (p): p is Product => typeof p === "object" && p !== null && "slug" in p,
  );
  const productLinks = products
    .map((p) => {
      const categorySlug = resolveCategorySlug(p);
      return categorySlug ? { name: p.name, href: `/products/${categorySlug}/${p.slug}` } : null;
    })
    .filter((l): l is { name: string; href: string } => l !== null);

  const hero = asMedia(project.heroImage) ?? asMedia(project.afterImage);
  const before = asMedia(project.beforeImage);
  const after = asMedia(project.afterImage);
  const quoteHref = products[0]
    ? `/quote?product=${encodeURIComponent(products[0].slug)}`
    : "/quote";

  const { docs: related } = await payload.find({
    collection: "projects",
    where: {
      _status: { equals: "published" },
      id: { not_equals: project.id },
      ...(project.type ? { type: { equals: project.type } } : {}),
    },
    depth: 1,
    limit: 3,
    sort: "-completionDate",
  });

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Projects", path: "/projects" },
      { name: project.title, path: `/projects/${project.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.title,
      url: absoluteUrl(`/projects/${project.slug}`),
      ...(project.location ? { locationCreated: project.location } : {}),
      ...(project.completionDate ? { dateCreated: project.completionDate } : {}),
    },
  ];

  const rooms = project.room ?? [];
  const services = project.services ?? [];
  const materials = project.materialsUsed ?? [];

  return (
    <main className="flex-1">
      <JsonLd data={jsonLd} />
      <Container className="py-16 md:py-24">
        {/* Header */}
        <div className="rule border-b pb-10">
          <SectionHeading
            index="03"
            label={`${project.type === "commercial" ? "Commercial" : "Residential"} — ${project.location ?? "Winnipeg"}`}
            as="h1"
          >
            {project.title.split(" ").slice(0, -1).join(" ")}{" "}
            <em className="font-serif italic">{project.title.split(" ").slice(-1).join("")}</em>
          </SectionHeading>
        </div>

        {/* Gallery / hero */}
        {hero?.url ? (
          <div className="relative mt-12 aspect-[16/9] w-full overflow-hidden bg-ink/5">
            <Image
              src={hero.url}
              alt={hero.alt ?? `${project.title} — project photo`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        {/* Specs */}
        <dl className="mt-14 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-background px-6 py-5">
            <dt className="text-label text-ink/45">Location</dt>
            <dd className="mt-1 font-serif text-lg text-ink">
              {project.location ?? "Winnipeg, MB"}
            </dd>
          </div>
          <div className="bg-background px-6 py-5">
            <dt className="text-label text-ink/45">Type</dt>
            <dd className="mt-1 font-serif text-lg text-ink">
              {project.type === "commercial" ? "Commercial" : "Residential"}
            </dd>
          </div>
          <div className="bg-background px-6 py-5">
            <dt className="text-label text-ink/45">Completed</dt>
            <dd className="mt-1 font-serif text-lg text-ink">
              {project.completionDate
                ? new Date(project.completionDate).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                  })
                : "—"}
            </dd>
          </div>
          <div className="bg-background px-6 py-5">
            <dt className="text-label text-ink/45">Rooms</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {rooms.length > 0 ? (
                rooms.map((r) => <Chip key={r}>{r.replace(/-/g, " ")}</Chip>)
              ) : (
                <span className="text-ink/60">—</span>
              )}
            </dd>
          </div>
        </dl>
        {services.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-label text-ink/45">Services</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {services.map((s) => (
                <li key={s.id ?? s.service}>
                  <Chip>{s.service}</Chip>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Description */}
        {project.description ? (
          <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal as="h2" className="lg:col-span-3 font-serif text-2xl text-ink">
              About <em className="font-serif italic">this project</em>
            </Reveal>
            <p className="lg:col-span-7 text-lg leading-relaxed text-ink/80">
              {project.description}
            </p>
          </div>
        ) : null}

        {/* Before / after */}
        {before?.url && after?.url ? (
          <section className="mt-16" aria-label="Before and after comparison">
            <h2 className="text-label text-ink/45">Before / After</h2>
            <div className="mt-6">
              <BeforeAfterSlider
                label={`${project.title} — before and after`}
                before={
                  <Image
                    src={before.url}
                    alt={before.alt ?? `${project.title} — before`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                }
                after={
                  <Image
                    src={after.url}
                    alt={after.alt ?? `${project.title} — after`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                }
              />
            </div>
          </section>
        ) : null}

        {/* Materials used */}
        {productLinks.length > 0 || materials.length > 0 ? (
          <section className="mt-16 border-t border-line pt-12" aria-label="Materials used">
            <Reveal as="h2" className="font-serif text-2xl text-ink">
              Materials <em className="font-serif italic">used</em>
            </Reveal>
            {productLinks.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>
                      <Chip className="transition-colors hover:border-brass hover:text-brass">
                        {l.name}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {materials.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {materials.map((m) => (
                  <li key={m.id ?? m.material}>
                    <Chip dark={false} className="text-ink/50">
                      {m.material}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {/* Get this look */}
        <section className="mt-20 bg-ink px-8 py-14 text-center md:px-16">
          <Reveal as="h2" className="font-serif text-3xl text-bone md:text-4xl">
            Get <em className="font-serif italic">this look</em>
          </Reveal>
          <p className="mx-auto mt-4 max-w-xl text-bone/60">
            We supply, fabricate, and install — tell us about your space and we&apos;ll quote the
            materials in this project.
          </p>
          <div className="mt-8">
            <Button href={quoteHref} variant="solid" dark>
              Request a quote
            </Button>
          </div>
        </section>

        {/* Related projects */}
        {related.length > 0 ? (
          <section className="mt-20" aria-label="Related projects">
            <div className="rule flex items-end justify-between border-b pb-6">
              <SectionHeading index="03" label="Keep browsing">
                More {project.type === "commercial" ? "commercial" : "residential"}{" "}
                <em className="font-serif italic">projects</em>
              </SectionHeading>
              <Link
                href="/projects"
                className="text-label text-brass underline-offset-4 hover:underline"
              >
                All projects →
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p: Project, i: number) => (
                <li key={p.id}>
                  <ProjectCard project={p} priority={i === 0} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
