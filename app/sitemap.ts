import type { MetadataRoute } from "next";
import { getPayloadCached } from "@/lib/payload";
import { listAllProductPaths, listCategories } from "@/lib/queries/products";
import { getBaseUrl } from "@/lib/seo/metadata";

type SitemapEntry = MetadataRoute.Sitemap[number];

/** Static marketing routes with their crawl priority. */
const MARKETING_ROUTES = [
  { path: "/quote", priority: 0.7 },
  { path: "/trade", priority: 0.7 },
  { path: "/custom-studio", priority: 0.7 },
  { path: "/samples", priority: 0.6 },
  { path: "/consultation", priority: 0.6 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const payload = await getPayloadCached();

  const [categories, productPaths, projects, solutions] = await Promise.all([
    listCategories(),
    listAllProductPaths(),
    payload.find({
      collection: "projects",
      where: { _status: { equals: "published" } },
      limit: 100,
      depth: 0,
    }),
    payload.find({
      collection: "solutions",
      where: { _status: { equals: "published" } },
      limit: 0,
      depth: 0,
    }),
  ]);

  const entries: SitemapEntry[] = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/projects`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/solutions`, changeFrequency: "weekly", priority: 0.7 },
    ...MARKETING_ROUTES.map(
      ({ path, priority }): SitemapEntry => ({
        url: `${base}${path}`,
        changeFrequency: "monthly",
        priority,
      }),
    ),
    ...categories.map(
      (category): SitemapEntry => ({
        url: `${base}/products/${category.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    ),
    ...productPaths.map(
      ({ categorySlug, slug }): SitemapEntry => ({
        url: `${base}/products/${categorySlug}/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    ),
    ...projects.docs.map(
      (project): SitemapEntry => ({
        url: `${base}/projects/${project.slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    ...solutions.docs.map(
      (solution): SitemapEntry => ({
        url: `${base}/solutions/${solution.slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
  ];

  return entries;
}
