import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CategoryCrossfadeLayer,
  CategoryCrossfadeProvider,
  CategoryCrossfadeTrigger,
  type CrossfadeLayerImage,
} from "@/components/catalog/CategoryHeroCrossfade";
import { FaqAccordion } from "@/components/catalog/FaqAccordion";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { SpecRow } from "@/components/ui/SpecRow";
import {
  applicationLabel,
  getCategoryBySlug,
  listCategories,
  listProductsByCategory,
} from "@/lib/queries/products";
import { breadcrumbJsonLd, JsonLd, mediaAbsoluteUrl } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Faq, Media } from "@/payload-types";

export async function generateMetadata({
  params,
}: PageProps<"/products/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const hero = typeof category.heroImage === "object" ? category.heroImage : null;
  return buildMetadata({
    title: category.seo?.metaTitle ?? category.name,
    description:
      category.seo?.metaDescription ??
      category.intro ??
      `${category.name} — premium decorative building materials from PKEE Constructions, Winnipeg.`,
    path: `/products/${category.slug}`,
    image: mediaAbsoluteUrl(category.seo?.ogImage ?? hero),
  });
}

function isFaq(value: number | Faq): value is Faq {
  return typeof value === "object";
}

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === "object" && value !== null;
}

export default async function CategoryPage({ params }: PageProps<"/products/[category]">) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, allCategories] = await Promise.all([
    listProductsByCategory(category.id),
    listCategories(),
  ]);

  const hero = isMedia(category.heroImage) ? category.heroImage : null;
  const heroSrc = hero?.sizes?.hero?.url ?? hero?.url;
  const faqs = (category.faqs ?? []).filter(isFaq).map((faq, i) => ({
    id: faq.id ?? `faq-${i}`,
    question: faq.question,
    answer: faq.answer,
  }));
  const related = allCategories.filter((c) => c.id !== category.id && c.group === category.group);
  const relatedFallback =
    related.length > 0 ? related : allCategories.filter((c) => c.id !== category.id).slice(0, 3);

  // Dekton-pattern hero crossfade: hovering a card fades its photography in
  // over the category hero (opacity layers, client-side only). Capped to
  // keep the preloaded stack light.
  const crossfadeLayers: CrossfadeLayerImage[] = products
    .flatMap((product) => {
      const image = isMedia(product.heroImage) ? product.heroImage : null;
      const src = image?.sizes?.card?.url ?? image?.url;
      return src ? [{ id: String(product.id), src, alt: image?.alt ?? product.name }] : [];
    })
    .slice(0, 12);

  return (
    <CategoryCrossfadeProvider layers={crossfadeLayers}>
      <div className="flex-1">
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Products", path: "/products" },
            { name: category.name, path: `/products/${category.slug}` },
          ])}
        />

        {/* Editorial hero: full-bleed image, name + intro bottom-left */}
        <section className="relative flex min-h-[62svh] items-end overflow-hidden bg-ink">
          {heroSrc && (
            <Image
              src={heroSrc}
              alt={hero?.alt || `${category.name} — category hero`}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-70"
            />
          )}
          <CategoryCrossfadeLayer />
          <Container className="relative z-10 pb-14 pt-40">
            <p className="text-label text-brass">Material Library — Category</p>
            <Reveal
              as="h1"
              className="mt-4 max-w-4xl text-5xl font-medium tracking-tight text-[color:var(--bone-on-ink)] md:text-7xl"
            >
              {category.name}
            </Reveal>
            {category.intro && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--bone-dim)]">
                {category.intro}
              </p>
            )}
          </Container>
        </section>

        {/* Benefits as hairline spec rows */}
        {category.benefits && category.benefits.length > 0 && (
          <section className="border-b rule">
            <Container className="py-16 md:py-20">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <p className="text-label text-brass">Why this category</p>
                  <h2 className="mt-4 text-3xl font-medium tracking-tight text-ink md:text-4xl">
                    Benefits, <em className="font-serif italic">plainly stated.</em>
                  </h2>
                </div>
                <dl className="lg:col-span-8">
                  {category.benefits.map((b, i) => (
                    <SpecRow key={b.id ?? i} label={`0${i + 1}`} value={b.benefit} />
                  ))}
                </dl>
              </div>
            </Container>
          </section>
        )}

        {/* Applications strip */}
        {category.applications && category.applications.length > 0 && (
          <section className="border-b rule">
            <Container className="py-12">
              <p className="text-label mb-5 text-ink/50">Applications</p>
              <ul className="flex flex-wrap gap-2.5">
                {category.applications.map((app) => (
                  <li key={app}>
                    <Link
                      href={`/solutions/${app}`}
                      className="transition-opacity duration-300 hover:opacity-70"
                    >
                      <Chip>{applicationLabel(app)}</Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        )}

        {/* Products in category */}
        <section>
          <Container className="py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="m-0 text-3xl font-medium tracking-tight text-ink">
                {products.length} {products.length === 1 ? "material" : "materials"}
              </h2>
              <Link
                href="/products"
                className="text-xs uppercase tracking-[0.12em] text-brass underline-offset-4 hover:underline"
              >
                Browse the full library →
              </Link>
            </div>
            {products.length === 0 ? (
              <p className="mt-10 border border-stone px-8 py-14 text-ink/60">
                New arrivals in this category are on their way.{" "}
                <Link href="/quote" className="text-brass underline-offset-4 hover:underline">
                  Ask us what&apos;s landing next →
                </Link>
              </p>
            ) : (
              <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product, i) => (
                  <li key={product.id}>
                    <CategoryCrossfadeTrigger id={String(product.id)}>
                      <ProductCard product={product} priority={i < 4} />
                    </CategoryCrossfadeTrigger>
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </section>

        {/* FAQ accordion */}
        {faqs.length > 0 && (
          <section className="border-t rule">
            <Container className="py-16 md:py-20">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <p className="text-label text-brass">Questions</p>
                  <h2 className="mt-4 text-3xl font-medium tracking-tight text-ink">
                    Before you <em className="font-serif italic">decide.</em>
                  </h2>
                </div>
                <div className="lg:col-span-8">
                  <FaqAccordion items={faqs} />
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* Quote CTA band */}
        <section className="bg-ink">
          <Container className="flex flex-col items-start gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-20">
            <div>
              <p className="text-label text-brass">Project pricing</p>
              <h2 className="mt-3 max-w-xl text-3xl font-medium tracking-tight text-[color:var(--bone-on-ink)] md:text-4xl">
                Every {category.name.toLowerCase()} quote is scoped to your space.
              </h2>
            </div>
            <Button href={`/quote?category=${category.slug}`} dark>
              Request a quote
            </Button>
          </Container>
        </section>

        {/* Related categories */}
        {relatedFallback.length > 0 && (
          <section className="border-t rule">
            <Container className="py-16">
              <p className="text-label mb-6 text-ink/50">Related categories</p>
              <ul className="grid grid-cols-1 gap-px border rule sm:grid-cols-3">
                {relatedFallback.slice(0, 3).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products/${cat.slug}`}
                      className="group flex h-full flex-col justify-between gap-8 p-6 transition-colors duration-300 hover:bg-stone/25"
                    >
                      <span className="text-lg font-medium tracking-tight text-ink">
                        {cat.name}
                      </span>
                      <span className="text-xs uppercase tracking-[0.12em] text-brass">
                        View category →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        )}
      </div>
    </CategoryCrossfadeProvider>
  );
}
