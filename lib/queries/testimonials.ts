import type { TestimonialItem } from "@/components/marketing/home-types";
import { getPayloadCached } from "@/lib/payload";
import type { Product } from "@/payload-types";

const PUBLISHED = { equals: "published" } as const;

/**
 * Social proof for a product page: published testimonials whose product sits
 * in the same category, falling back to the most recent published ones.
 * Returns an empty array when nothing is published — callers render nothing.
 */
export async function listProductTestimonials(
  product: Product,
  limit = 3,
): Promise<TestimonialItem[]> {
  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "testimonials",
    where: { _status: PUBLISHED },
    sort: "-createdAt",
    limit: 50,
    depth: 1,
    overrideAccess: false,
  });

  const categoryId = typeof product.category === "object" ? product.category?.id : product.category;

  const matchesCategory = (doc: (typeof docs)[number]): boolean => {
    const rel = doc.product;
    if (typeof rel !== "object" || rel === null) return false;
    const relCategory = rel.category;
    const relCategoryId = typeof relCategory === "object" ? relCategory?.id : relCategory;
    return relCategoryId != null && relCategoryId === categoryId;
  };

  const pool = docs.filter(matchesCategory);
  const chosen = (pool.length > 0 ? pool : docs).slice(0, limit);

  return chosen.map((doc) => ({
    name: doc.name,
    rating: doc.rating,
    text: doc.text,
    location: doc.location ?? null,
    verified: Boolean(doc.verified),
  }));
}
