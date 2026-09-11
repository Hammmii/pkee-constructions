import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Track } from "@/components/analytics/Track";
import { TrackClick } from "@/components/analytics/TrackClick";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { SpecRow } from "@/components/ui/SpecRow";
import {
  applicationLabel,
  asMedia,
  getProductBySlug,
  listProjectsUsingProduct,
  listRelatedProducts,
  propertyLabel,
} from "@/lib/queries/products";
import { breadcrumbJsonLd, JsonLd, mediaAbsoluteUrl, productJsonLd } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { site, whatsappLink } from "@/lib/site";
import { productInquiryMessage } from "@/lib/whatsapp";
import type { Media, Product } from "@/payload-types";
import { FinishSwatches } from "./_components/FinishSwatches";
import { ProductGallery } from "./_components/ProductGallery";
import { ProjectsStrip } from "./_components/ProjectsStrip";

export async function generateMetadata({
  params,
}: PageProps<"/products/[category]/[slug]">): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductBySlug(category, slug);
  if (!product) return {};
  return buildMetadata({
    title: product.seo?.metaTitle ?? product.name,
    description:
      product.seo?.metaDescription ??
      product.summary ??
      `${product.name} — ${typeof product.category === "object" ? product.category.name : "premium material"} from PKEE Constructions, Winnipeg.`,
    path: `/products/${category}/${product.slug}`,
    image: mediaAbsoluteUrl(product.seo?.ogImage ?? asMedia(product.heroImage)),
  });
}

/** Lexical richText → plain paragraphs (specs are real text, not images). */
function descriptionToText(description: Product["description"]): string[] {
  if (!description?.root?.children) return [];
  const paragraphs: string[] = [];
  for (const node of description.root.children as {
    type?: string;
    children?: { text?: string }[];
  }[]) {
    if (node.type !== "paragraph" || !node.children) continue;
    const text = node.children
      .map((child) => child.text ?? "")
      .join("")
      .trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

export default async function ProductPage({ params }: PageProps<"/products/[category]/[slug]">) {
  const { category: categorySlug, slug } = await params;
  const product = await getProductBySlug(categorySlug, slug);
  if (!product) notFound();

  const category = typeof product.category === "object" ? product.category : null;

  const [related, projects] = await Promise.all([
    listRelatedProducts(product),
    listProjectsUsingProduct(product.id, 4),
  ]);

  const hero = asMedia(product.heroImage);
  const galleryMedia = (product.gallery ?? [])
    .map((g) => asMedia(g as number | Media))
    .filter((m): m is Media => m !== null);
  const images = [hero, ...galleryMedia]
    .filter((m): m is Media => m !== null && Boolean(m.url))
    .map((m) => ({
      src: m.sizes?.hero?.url ?? m.url ?? "",
      alt: m.alt || product.name,
      width: m.width,
      height: m.height,
    }));

  const specRows: { label: string; value: string }[] = [];
  if (product.material) specRows.push({ label: "Material", value: product.material });
  if (product.sizes?.length) {
    specRows.push({ label: "Sizes", value: product.sizes.map((s) => s.size).join(" · ") });
  }
  if (product.thickness) specRows.push({ label: "Thickness", value: product.thickness });
  if (product.cuttingMethod) {
    specRows.push({ label: "Cutting method", value: product.cuttingMethod });
  }
  if (product.properties?.length) {
    specRows.push({
      label: "Properties",
      value: product.properties.map(propertyLabel).join(" · "),
    });
  }

  const badges = [
    product.indoorOutdoor === "both"
      ? "Indoor & Outdoor"
      : product.indoorOutdoor
        ? product.indoorOutdoor === "indoor"
          ? "Indoor use"
          : "Outdoor rated"
        : null,
    product.backlit ? "Backlit ready" : null,
    product.customizable ? "Customizable" : null,
  ].filter((b): b is string => b !== null);

  const description = descriptionToText(product.description);
  const finishes = (product.finishes ?? []).map((f) => ({ name: f.name, hex: f.swatch }));
  const colors = (product.colors ?? []).map((c) => ({ name: c.name, hex: c.hex }));

  return (
    <div className="flex-1">
      <Track event="product_view" properties={{ product: product.slug, category: categorySlug }} />
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Products", path: "/products" },
            { name: category?.name ?? categorySlug, path: `/products/${categorySlug}` },
            { name: product.name, path: `/products/${categorySlug}/${product.slug}` },
          ]),
        ]}
      />

      {/* Breadcrumb */}
      <Container className="pt-28 md:pt-32">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-ink/45">
            <li>
              <Link href="/products" className="transition-colors duration-300 hover:text-brass">
                Products
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/products/${categorySlug}`}
                className="transition-colors duration-300 hover:text-brass"
              >
                {category?.name ?? categorySlug}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </Container>

      {/* Gallery + info */}
      <Container className="py-10 md:py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Bottom offset on mobile so the sticky quote card / floating CTA
              never covers the gallery thumbnail strip at any scroll position.
              Desktop keeps its sticky-column behaviour untouched. */}
          <div className="mb-24 lg:sticky lg:top-28 lg:mb-0 lg:self-start">
            <ProductGallery
              images={images}
              layoutIdPrefix={`product-${product.id}`}
              transitionName={`pkee-product-${product.slug}`}
              priority
            />
          </div>

          <div>
            <p className="text-label text-brass">{category?.name ?? "Material"}</p>
            <Reveal
              as="h1"
              className="mt-3 text-4xl font-medium tracking-tight text-ink md:text-6xl"
            >
              {product.name}
            </Reveal>
            {product.summary && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/65">{product.summary}</p>
            )}

            {badges.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2.5" aria-label="Product attributes">
                {badges.map((badge) => (
                  <li key={badge}>
                    <Chip>{badge}</Chip>
                  </li>
                ))}
              </ul>
            )}

            {finishes.length > 0 && (
              <div className="mt-10">
                <FinishSwatches title="Finishes" swatches={finishes} idPrefix="finish" />
              </div>
            )}
            {colors.length > 0 && (
              <div className="mt-8">
                <FinishSwatches title="Colours" swatches={colors} idPrefix="color" />
              </div>
            )}

            {specRows.length > 0 && (
              <dl className="mt-10">
                {specRows.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
              </dl>
            )}

            {product.applications?.length ? (
              <div className="mt-10">
                <p className="text-label mb-4 text-ink/50">Applications</p>
                <ul className="flex flex-wrap gap-2.5">
                  {product.applications.map((app) => (
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
              </div>
            ) : null}

            {description.length > 0 && (
              <div className="mt-10 max-w-xl space-y-4 border-t rule pt-8">
                {description.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="m-0 text-[0.95rem] leading-relaxed text-ink/70"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Quote CTAs — sticky on desktop */}
            <div className="sticky bottom-6 mt-12 border border-stone bg-bone/95 p-6 backdrop-blur-sm">
              <p className="text-label text-ink/50">Quoted per project</p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Button href={`/quote?product=${product.slug}`}>Request a quote</Button>
                <Button href="/samples" variant="ghost">
                  Request a sample
                </Button>
              </div>
              <p className="mt-4 mb-0 text-xs leading-relaxed text-ink/45">
                No public pricing — every material is scoped to your dimensions, finish and
                installation. Showroom: 360 Keewatin St, Winnipeg.
              </p>
              <p className="mt-3 text-xs text-ink/55">
                <TrackClick
                  event="whatsapp_click"
                  source={`product:${product.slug}`}
                  href={whatsappLink(productInquiryMessage({ name: product.name }))}
                >
                  <a
                    href={whatsappLink(productInquiryMessage({ name: product.name }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ask about ${product.name} on WhatsApp at ${site.whatsapp.display}`}
                    className="text-brass underline-offset-4 hover:underline"
                  >
                    Ask about this material on WhatsApp
                  </a>
                </TrackClick>{" "}
                — replies within one business day.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t rule">
          <Container className="py-16 md:py-20">
            <p className="text-label text-brass">Keep exploring</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
              You may <em className="font-serif italic">also like.</em>
            </h2>
            <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <ProjectsStrip projects={projects} />

      {/* Mobile floating quote CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t rule bg-bone/95 p-3 backdrop-blur-sm lg:hidden">
        <div className="flex gap-3">
          <Button href={`/quote?product=${product.slug}`} className="h-12 flex-1">
            Request a quote
          </Button>
          <Button href="/samples" variant="ghost" className="h-12 flex-1">
            Sample
          </Button>
        </div>
      </div>
    </div>
  );
}
