import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Track } from "@/components/analytics/Track";
import { ProductCard } from "@/components/catalog/ProductCard";
import { type CatalogFilterState, ProductFilters } from "@/components/catalog/ProductFilters";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  listFilterOptions,
  listProducts,
  PRODUCT_PAGE_SIZE,
  propertyLabel,
} from "@/lib/queries/products";
import { itemListJsonLd, JsonLd, localBusinessJsonLd } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { CatalogEmptyState } from "./_components/CatalogEmptyState";
import { Pagination } from "./_components/Pagination";

export const metadata: Metadata = buildMetadata({
  title: "Material Library",
  description:
    "Browse PKEE Constructions' full range of premium decorative building materials — PVC wall panels, decor sheets, faux stone, louver panels, WPC and custom fabrication. 360 Keewatin St, Winnipeg.",
  path: "/products",
});

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Rebuild the shareable query string for pagination links (no page param). */
function filterQueryFrom(state: CatalogFilterState): string {
  const params = new URLSearchParams();
  if (state.category) params.set("category", state.category);
  if (state.material) params.set("material", state.material);
  if (state.indoorOutdoor) params.set("indoorOutdoor", state.indoorOutdoor);
  if (state.backlit) params.set("backlit", "1");
  if (state.customizable) params.set("customizable", "1");
  if (state.properties?.length) params.set("properties", state.properties.join(","));
  if (state.q) params.set("q", state.q);
  if (state.sort) params.set("sort", state.sort);
  return params.toString();
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;

  const state: CatalogFilterState = {
    category: single(sp.category),
    material: single(sp.material),
    indoorOutdoor: single(sp.indoorOutdoor),
    backlit: single(sp.backlit) === "1",
    customizable: single(sp.customizable) === "1",
    properties: single(sp.properties)
      ?.split(",")
      .map((p) => p.trim())
      .filter(Boolean),
    q: single(sp.q),
    sort: single(sp.sort),
  };
  const page = Math.max(1, Number.parseInt(single(sp.page) ?? "1", 10) || 1);

  const [options, result] = await Promise.all([
    listFilterOptions(),
    listProducts({
      category: state.category,
      material: state.material,
      indoorOutdoor: state.indoorOutdoor,
      backlit: state.backlit,
      customizable: state.customizable,
      properties: state.properties,
      q: state.q,
      sort: state.sort === "name" ? "name" : "featured",
      page,
    }),
  ]);

  // Out-of-range page (e.g. filters shrank the result set): clamp to page 1,
  // preserving the active filters. (Next streams this redirect — the client
  // router / meta refresh performs the navigation.)
  if (result.products.length === 0 && result.total > 0 && page > 1) {
    const qs = filterQueryFrom(state);
    redirect(qs ? `/products?${qs}` : "/products");
  }

  const hasFilters = Boolean(filterQueryFrom(state));

  // Filter/search interactions on this listing live in the client filter
  // panel; the active params are reflected here on mount instead.
  const activeFilterProperties = {
    category: state.category ?? null,
    material: state.material ?? null,
    indoorOutdoor: state.indoorOutdoor ?? null,
    backlit: state.backlit,
    customizable: state.customizable,
    properties: state.properties?.length ? state.properties.join(",") : null,
    sort: state.sort ?? null,
  };

  return (
    <main className="flex-1">
      <JsonLd data={[itemListJsonLd(result.products), localBusinessJsonLd()]} />
      {state.q ? <Track event="search" properties={{ q: state.q, results: result.total }} /> : null}
      {hasFilters ? <Track event="filter_use" properties={activeFilterProperties} /> : null}
      <Container className="py-16 md:py-24">
        <div className="rule flex flex-wrap items-end justify-between gap-6 border-b pb-8">
          <SectionHeading index="01" label="Material Library" as="h1">
            Every material, <em className="font-serif italic">one showroom.</em>
          </SectionHeading>
          <p className="text-label text-ink/45" aria-live="polite">
            {result.total} {result.total === 1 ? "material" : "materials"}
            {result.total > PRODUCT_PAGE_SIZE && (
              <>
                {" "}
                — page {result.page} of {result.totalPages}
              </>
            )}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <ProductFilters
                options={{
                  categories: options.categories,
                  materials: options.materials,
                  properties: options.properties.map((value) => ({
                    value,
                    label: propertyLabel(value),
                  })),
                }}
                state={state}
                resultCount={result.total}
              />
            </div>
          </aside>

          <div className="lg:col-span-9">
            {result.products.length === 0 ? (
              <CatalogEmptyState hasFilters={hasFilters} />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
                  {result.products.map((product, i) => (
                    <li key={product.id}>
                      <ProductCard product={product} priority={i < 3} />
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  query={filterQueryFrom(state)}
                  className="mt-16"
                />
              </>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
