import type { Metadata } from "next";
import { TrackClick } from "@/components/analytics/TrackClick";
import { SamplesForm } from "@/components/samples/SamplesForm";
import type { SampleProductOption } from "@/components/samples/types";
import { getPayloadCached } from "@/lib/payload";
import { site, whatsappLink } from "@/lib/site";
import { samplesRequestMessage } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Order Samples",
    description:
      "Feel the material before you commit — order free PKEE samples of any product, in the colour and finish you are considering.",
  };
}

/**
 * Fetches the published product list for the samples step and resolves the
 * ?product=slug prefill (from product pages and catalog CTAs).
 */
export default async function SamplesPage({ searchParams }: PageProps<"/samples">) {
  const { product } = await searchParams;
  const productSlug = typeof product === "string" ? product : undefined;

  const payload = await getPayloadCached();
  const { docs } = await payload.find({
    collection: "products",
    where: { _status: { equals: "published" } },
    depth: 0,
    limit: 300,
    sort: "name",
  });

  const products: SampleProductOption[] = docs.map((doc) => ({
    id: String(doc.id),
    name: doc.name,
    slug: doc.slug,
  }));

  let preselectedProductId = "";
  if (productSlug) {
    const match = products.find((entry) => entry.slug === productSlug);
    if (match) preselectedProductId = match.id;
  }

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Samples</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          Feel it before you commit.
        </h1>
        <p className="mt-4 max-w-xl text-foreground/60">
          Colour and finish read differently in your own light. Tell us what you are considering and
          we will send physical samples to your door — a specialist confirms every request within 2
          business days.
        </p>
        <p className="mt-4 text-sm text-foreground/55">
          Not sure which to pick?{" "}
          <TrackClick
            event="whatsapp_click"
            source="samples"
            href={whatsappLink(samplesRequestMessage())}
          >
            <a
              href={whatsappLink(samplesRequestMessage())}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask ${site.name} for sample suggestions on WhatsApp at ${site.whatsapp.display}`}
              className="text-brass underline-offset-4 hover:underline"
            >
              Send us photos of your space on WhatsApp
            </a>
          </TrackClick>{" "}
          and we&rsquo;ll suggest matches.
        </p>

        {preselectedProductId && (
          <p className="mt-6 inline-block border border-brass/50 px-4 py-2 text-[0.8125rem] uppercase tracking-[0.12em] text-ink">
            Prefilled — {products.find((entry) => entry.id === preselectedProductId)?.name}
          </p>
        )}

        <div className="mt-12">
          <SamplesForm
            products={products}
            preselectedProductId={preselectedProductId}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          />
        </div>
      </div>
    </div>
  );
}
