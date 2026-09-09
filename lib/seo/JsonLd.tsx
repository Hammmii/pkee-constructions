import type { Media, Product } from "@/payload-types";
import { absoluteUrl, getBaseUrl } from "./metadata";

export const BRAND = {
  name: "PKEE Constructions",
  street: "360 Keewatin St",
  city: "Winnipeg",
  region: "MB",
  country: "CA",
} as const;

export function mediaAbsoluteUrl(media: Media | number | null | undefined): string | undefined {
  if (typeof media !== "object" || media === null) return undefined;
  const url = media.url;
  if (!url) return undefined;
  return url.startsWith("http") ? url : absoluteUrl(url);
}

type JsonLdThing = Record<string, unknown>;

export function productJsonLd(product: Product): JsonLdThing {
  const images = [
    mediaAbsoluteUrl(product.heroImage),
    ...(product.gallery ?? [])
      .map((g) => mediaAbsoluteUrl(g as number | Media))
      .filter((u): u is string => Boolean(u)),
  ].filter((u): u is string => Boolean(u));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    slug: product.slug,
    image: images,
    brand: { "@type": "Brand", name: BRAND.name },
    description: product.summary ?? undefined,
    category: typeof product.category === "object" ? product.category.name : undefined,
    // No offers/p pricing: quotes-only business model (brand rules).
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdThing {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(
  products: { name: string; slug: string; category?: { slug?: string } | number }[],
): JsonLdThing {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: product.name,
      url: absoluteUrl(
        typeof product.category === "object" && product.category?.slug
          ? `/products/${product.category.slug}/${product.slug}`
          : `/products/${product.slug}`,
      ),
    })),
  };
}

/** Stub for reuse across pages — one canonical LocalBusiness/Organization record. */
export function localBusinessJsonLd(): JsonLdThing {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Organization"],
    name: BRAND.name,
    url: getBaseUrl(),
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND.street,
      addressLocality: BRAND.city,
      addressRegion: BRAND.region,
      addressCountry: BRAND.country,
    },
  };
}

type JsonLdProps = {
  data: JsonLdThing | JsonLdThing[];
};

/**
 * Server component: serializes structured data into a script tag. Values are
 * JSON-stringified (React escapes), so CMS text cannot break out of the tag.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw script content; input is structured data, React-escaped
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
