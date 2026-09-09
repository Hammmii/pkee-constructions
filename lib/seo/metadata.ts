import type { Metadata } from "next";

/**
 * Absolute site URL. `NEXT_PUBLIC_SITE_URL` in production; localhost fallback
 * for dev/sitemap generation. Never invent a public origin.
 */
export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  /** Route path, e.g. "/products/pvc-wall-panels". Becomes canonical + OG url. */
  path: string;
  /** Absolute or site-relative image path (media URL /api/media/... is fine). */
  image?: string | null;
  /** Defaults to index,follow; pass false for filtered/search parameter pages. */
  index?: boolean;
};

/**
 * Shared metadata factory. Title goes through the root layout's
 * "%s — PKEE Constructions" template; canonical/OG URLs are always absolute.
 * Filtered catalog URLs (any query string) must not be canonicalized with
 * their params — callers pass the clean path and set index:false when needed.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  index = true,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "PKEE Constructions",
      type: "website",
      locale: "en_CA",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
