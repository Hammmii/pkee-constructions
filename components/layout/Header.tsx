import { getPayloadCached } from "@/lib/payload";
import { HeaderClient } from "./HeaderClient";
import type { MegaCategory } from "./types";

/**
 * Global header. Fetches published product categories for the mega-menu on
 * every request (deduped per render via `getPayloadCached`). A CMS failure
 * must never take down the site chrome — the header renders with an empty
 * tile grid and the rest of the page is unaffected.
 */
export async function Header() {
  let categories: MegaCategory[] = [];

  try {
    const payload = await getPayloadCached();
    const { docs } = await payload.find({
      collection: "product-categories",
      where: { _status: { equals: "published" } },
      sort: "name",
      limit: 19,
      depth: 1,
      select: { name: true, slug: true, heroImage: true },
    });

    categories = docs
      .map((doc): MegaCategory | null => {
        const heroImage = doc.heroImage;
        const media = typeof heroImage === "object" && heroImage !== null ? heroImage : null;
        return {
          name: doc.name,
          slug: doc.slug,
          image: media?.url
            ? {
                url: media.sizes?.card?.url ?? media.url,
                alt: media.alt || `${doc.name} — product category`,
                width: media.width,
                height: media.height,
              }
            : null,
        };
      })
      .filter((category): category is MegaCategory => category !== null);
  } catch {
    categories = [];
  }

  return <HeaderClient categories={categories} />;
}
