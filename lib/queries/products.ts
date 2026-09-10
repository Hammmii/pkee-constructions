import { getPayloadCached } from "@/lib/payload";
import type { Media, Product, ProductCategory, Project } from "@/payload-types";

export const PRODUCT_PAGE_SIZE = 12;

export type ProductSort = "featured" | "name";

const PUBLISHED = { equals: "published" } as const;

/** Display labels for the `properties` select (mirrors collections/Products.ts). */
export const PROPERTY_LABELS: Record<string, string> = {
  waterproof: "Waterproof",
  "fire-resistant": "Fire-Resistant",
  "scratch-resistant": "Scratch-Resistant",
  "eco-friendly": "Eco-Friendly",
  "budget-friendly": "Budget-Friendly",
  "easy-install": "Easy Install",
};

/** Display labels for the `applications` select (mirrors collections/Products.ts). */
export const APPLICATION_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  office: "Office",
  restaurant: "Restaurant",
  retail: "Retail",
  hotel: "Hotel",
  outdoor: "Outdoor",
  "feature-wall": "Feature Wall",
  fireplace: "Fireplace",
  "prayer-room": "Prayer Room",
  ceiling: "Ceiling",
  basement: "Basement",
};

export function applicationLabel(value: string): string {
  return APPLICATION_LABELS[value] ?? value;
}

export function propertyLabel(value: string): string {
  return PROPERTY_LABELS[value] ?? value;
}

type ProductWithCategory = Product & { category: ProductCategory };
type CategoryWithFaqs = ProductCategory & { faqs?: ProductCategory["faqs"] & {} };

function isPopulated<T>(value: number | T | null | undefined): value is T {
  return typeof value === "object" && value !== null;
}

export function asCategory(product: Product): ProductCategory | null {
  return isPopulated<ProductCategory>(product.category) ? product.category : null;
}

export function asMedia(value: number | Media | null | undefined): Media | null {
  return isPopulated<Media>(value) ? value : null;
}

export type CatalogFilter = {
  category?: string;
  material?: string;
  indoorOutdoor?: string;
  backlit?: boolean;
  customizable?: boolean;
  properties?: string[];
  q?: string;
  sort?: ProductSort;
  page?: number;
};

export type CatalogResult = {
  products: ProductWithCategory[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Published-products listing for /products. All filtering happens server-side
 * via Payload `where` clauses; sort and pagination are applied here.
 * `featured` sort orders featured first, then name (stable, deterministic).
 */
export async function listProducts(filter: CatalogFilter): Promise<CatalogResult> {
  const payload = await getPayloadCached();
  const page = Math.max(1, filter.page ?? 1);

  const and: NonNullable<Parameters<typeof payload.find>[0]["where"]>[] = [{ _status: PUBLISHED }];
  if (filter.category) and.push({ "category.slug": { equals: filter.category } });
  if (filter.material) and.push({ material: { equals: filter.material } });
  if (filter.indoorOutdoor) and.push({ indoorOutdoor: { equals: filter.indoorOutdoor } });
  if (filter.backlit) and.push({ backlit: { equals: true } });
  if (filter.customizable) and.push({ customizable: { equals: true } });
  for (const prop of filter.properties ?? []) {
    and.push({ properties: { contains: prop } });
  }
  if (filter.q) and.push({ name: { like: filter.q } });

  const sort = filter.sort === "name" ? "name" : "-featured,name";

  const { docs, totalDocs } = await payload.find({
    collection: "products",
    where: { and },
    sort,
    page,
    limit: PRODUCT_PAGE_SIZE,
    depth: 1,
    overrideAccess: false,
  });

  const products = docs as ProductWithCategory[];
  const totalPages = Math.max(1, Math.ceil(totalDocs / PRODUCT_PAGE_SIZE));
  return { products, total: totalDocs, page, totalPages };
}

/** Fetch page 1 when the requested page is out of range (empty-result clamp). */
export async function listProductsClamped(filter: CatalogFilter): Promise<CatalogResult> {
  const result = await listProducts(filter);
  if (result.products.length === 0 && result.total > 0 && (filter.page ?? 1) > 1) {
    return listProducts({ ...filter, page: 1 });
  }
  return result;
}

export async function getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "product-categories",
    where: { and: [{ slug: { equals: slug } }, { _status: PUBLISHED }] },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  });
  return (docs[0] as CategoryWithFaqs | undefined) ?? null;
}

export type ProductDetail = Product & {
  category: ProductCategory;
  gallery?: (number | Media)[] | null;
  relatedProducts?: (number | ProductWithCategory)[] | null;
  seo?: Product["seo"] & { ogImage?: (number | null) | Media };
};

export async function getProductBySlug(
  categorySlug: string,
  slug: string,
): Promise<ProductDetail | null> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "products",
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: PUBLISHED },
        { "category.slug": { equals: categorySlug } },
      ],
    },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  });
  return (docs[0] as ProductDetail | undefined) ?? null;
}

/** Distinct facet values for the filter sidebar, derived from published products. */
export type FilterOptions = {
  categories: Pick<ProductCategory, "name" | "slug">[];
  materials: string[];
  properties: string[];
};

export async function listFilterOptions(): Promise<FilterOptions> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "products",
    where: { _status: PUBLISHED },
    limit: 0,
    depth: 1,
    sort: "name",
    overrideAccess: false,
  });

  const products = docs as ProductWithCategory[];
  const categoryMap = new Map<string, string>();
  const materials = new Set<string>();
  const properties = new Set<string>();

  for (const product of products) {
    const cat = asCategory(product);
    if (cat) categoryMap.set(cat.slug, cat.name);
    if (product.material) materials.add(product.material);
    for (const prop of product.properties ?? []) properties.add(prop);
  }

  return {
    categories: [...categoryMap.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    materials: [...materials].sort((a, b) => a.localeCompare(b)),
    properties: [...properties].sort((a, b) => a.localeCompare(b)),
  };
}

export async function listCategories(): Promise<ProductCategory[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "product-categories",
    where: { _status: PUBLISHED },
    sort: "name",
    limit: 0,
    depth: 1,
    overrideAccess: false,
  });
  return docs as ProductCategory[];
}

/** All published products for sitemap/related fallbacks (compact shape). */
export async function listAllProductPaths(): Promise<{ categorySlug: string; slug: string }[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "products",
    where: { _status: PUBLISHED },
    sort: "name",
    limit: 0,
    depth: 1,
    overrideAccess: false,
  });
  const paths: { categorySlug: string; slug: string }[] = [];
  for (const product of docs as ProductWithCategory[]) {
    const cat = asCategory(product);
    if (cat) paths.push({ categorySlug: cat.slug, slug: product.slug });
  }
  return paths;
}

/** Projects that use a given product, for the detail-page cross-sell strip. */
export async function listProjectsUsingProduct(productId: number, limit = 4): Promise<Project[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "projects",
    where: {
      and: [{ _status: PUBLISHED }, { "productsUsed.id": { equals: productId } }],
    },
    sort: "-createdAt",
    limit,
    depth: 1,
    overrideAccess: false,
  });
  return docs as Project[];
}

/** Related products: explicit relations first, same-category fallback. */
export async function listRelatedProducts(
  product: ProductDetail,
  limit = 4,
): Promise<ProductWithCategory[]> {
  const payload = await getPayloadCached();
  // depth-2 populate: relatedProducts entries are Product objects; the CMS
  // may also hand back bare ids when a relation is unpopulated — drop those.
  const explicit = (product.relatedProducts ?? [])
    .map((p): ProductWithCategory | null =>
      typeof p === "object" && p !== null && typeof p.category === "object"
        ? (p as ProductWithCategory)
        : null,
    )
    .filter((p): p is ProductWithCategory => p !== null && p.id !== product.id)
    .slice(0, limit);
  if (explicit.length >= limit) return explicit;

  const categoryId = isPopulated<ProductCategory>(product.category)
    ? product.category.id
    : product.category;
  const { docs } = await payload.find({
    collection: "products",
    where: {
      and: [
        { _status: PUBLISHED },
        { id: { not_equals: product.id } },
        ...(categoryId ? [{ "category.id": { equals: categoryId } }] : []),
      ],
    },
    sort: "-featured,name",
    limit: limit - explicit.length,
    depth: 1,
    overrideAccess: false,
  });
  const seen = new Set(explicit.map((p) => p.id));
  const rest = (docs as ProductWithCategory[]).filter((p) => !seen.has(p.id));
  return [...explicit, ...rest];
}

export async function listProductsByCategory(
  categoryId: number,
  excludeId?: number,
): Promise<ProductWithCategory[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "products",
    where: {
      and: [
        { _status: PUBLISHED },
        { "category.id": { equals: categoryId } },
        ...(excludeId ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
    sort: "-featured,name",
    limit: 0,
    depth: 1,
    overrideAccess: false,
  });
  return docs as ProductWithCategory[];
}
