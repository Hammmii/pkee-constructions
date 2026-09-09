import { getPayloadCached } from "@/lib/payload";
import { FooterView, type FooterCategory } from "./FooterView";

/**
 * Global footer — supplies the top product categories from the CMS and the
 * current year, then defers to the presentational `FooterView`. A CMS
 * failure renders the footer without the category list; the page still
 * ships.
 */
export async function Footer() {
  let categories: FooterCategory[] = [];

  try {
    const payload = await getPayloadCached();
    const { docs } = await payload.find({
      collection: "product-categories",
      where: { _status: { equals: "published" } },
      sort: "name",
      limit: 6,
      depth: 0,
      select: { name: true, slug: true },
    });
    categories = docs.map((doc) => ({ name: doc.name, slug: doc.slug }));
  } catch {
    categories = [];
  }

  return <FooterView categories={categories} year={new Date().getFullYear()} />;
}
