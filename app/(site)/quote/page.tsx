import type { Metadata } from "next";
import { Track } from "@/components/analytics/Track";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import type { CategoryOption, PreselectedProduct, ProductOption } from "@/components/quote/types";
import { getPayloadCached } from "@/lib/payload";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Request a Quote",
    description:
      "Tell us about your project — material, dimensions, timeline — and a PKEE specialist will respond within 2 business days.",
  };
}

/**
 * Fetches the lightweight product list for the material step and resolves
 * the ?product=slug prefill (from product pages and "Get this look" CTAs).
 */
export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const { product } = await searchParams;
  const productSlug = typeof product === "string" ? product : undefined;

  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "products",
    where: { _status: { equals: "published" } },
    depth: 1,
    limit: 300,
    sort: "name",
  });

  const products: ProductOption[] = docs.flatMap((doc) => {
    const category =
      typeof doc.category === "object" && doc.category !== null ? doc.category : null;
    return [
      {
        name: doc.name,
        slug: doc.slug,
        category: category?.name ?? null,
        categorySlug: category?.slug ?? null,
      },
    ];
  });

  const categoryMap = new Map<string, CategoryOption>();
  for (const entry of products) {
    if (entry.categorySlug && entry.category && !categoryMap.has(entry.categorySlug)) {
      categoryMap.set(entry.categorySlug, { name: entry.category, slug: entry.categorySlug });
    }
  }

  let preselected: PreselectedProduct | null = null;
  if (productSlug) {
    const match = products.find((entry) => entry.slug === productSlug) ?? null;
    if (match) {
      preselected = { name: match.name, slug: match.slug, categorySlug: match.categorySlug };
    }
  }

  return (
    <div className="flex-1 bg-background">
      <Track
        event="quote_start"
        properties={{ product: productSlug ?? null, preselected: Boolean(preselected) }}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Request a Quote</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          Let&rsquo;s spec your space.
        </h1>
        <p className="mt-4 max-w-xl text-foreground/60">
          Seven short steps — the more you tell us, the sharper the quote. No prices are published
          online; every request gets a specialist&rsquo;s answer within 2 business days.
        </p>

        {preselected && (
          <p className="mt-6 inline-block border border-brass/50 px-4 py-2 text-[0.8125rem] uppercase tracking-[0.12em] text-ink">
            Prefilled — {preselected.name}
          </p>
        )}

        <div className="mt-12">
          <QuoteWizard
            products={products}
            categories={[...categoryMap.values()]}
            preselected={preselected}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          />
        </div>
      </div>
    </div>
  );
}
