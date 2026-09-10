import type { MetadataRoute } from "next";
import { listAllProductPaths, listCategories } from "@/lib/queries/products";
import { getBaseUrl } from "@/lib/seo/metadata";

/** Static marketing routes (Phase 1 — catalog vertical slice first). */
const STATIC_ROUTES = ["/products"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();

  const [categories, productPaths] = await Promise.all([listCategories(), listAllProductPaths()]);

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "/products" ? 0.9 : 0.7,
    })),
    ...categories.map((category) => ({
      url: `${base}/products/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...productPaths.map(({ categorySlug, slug }) => ({
      url: `${base}/products/${categorySlug}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
