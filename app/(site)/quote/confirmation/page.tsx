import type { Metadata } from "next";
import Link from "next/link";
import { Track } from "@/components/analytics/Track";
import { getPayloadCached } from "@/lib/payload";

export const metadata: Metadata = {
  title: "Quote Request Received",
  robots: { index: false, follow: false },
};

const REFERENCE_PATTERN = /^PK-\d{4}-\d{4}$/;

/**
 * Post-submit landing. The reference is looked up server-side so the view
 * survives a refresh, but only the reference and the customer's first name
 * are ever rendered — no quote data is exposed publicly.
 */
export default async function QuoteConfirmationPage({
  searchParams,
}: PageProps<"/quote/confirmation">) {
  const { ref } = await searchParams;
  const reference = typeof ref === "string" && REFERENCE_PATTERN.test(ref) ? ref : null;

  let firstName: string | null = null;
  if (reference) {
    const payload = await getPayloadCached();
    const { docs } = await payload.find({
      collection: "quotes",
      where: { reference: { equals: reference } },
      limit: 1,
      depth: 0,
    });
    const quote = docs[0];
    if (quote) {
      firstName = quote.customer.name.trim().split(/\s+/)[0] ?? quote.customer.name;
    }
  }

  return (
    <div className="flex-1 bg-background">
      <Track event="quote_complete" properties={{ reference: reference ?? null }} />
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Request received</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          {firstName ? `Thank you, ${firstName}.` : "Thank you."}
        </h1>

        {reference ? (
          <>
            <p className="mt-6 text-foreground/60">Your reference number:</p>
            <p className="mt-2 inline-block border border-brass px-6 py-4 font-serif text-4xl tracking-wide text-brass">
              {reference}
            </p>
          </>
        ) : (
          <p className="mt-6 max-w-xl text-foreground/60">
            If you just submitted a request, we have it — a confirmation is on its way to your
            inbox.
          </p>
        )}

        <div className="mt-12 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">What happens next</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/80">
            <li>A specialist reviews your project details and attachments.</li>
            <li>We respond within 2 business days — usually sooner.</li>
            <li>
              You get material recommendations, samples options, and a tailored quote — no published
              pricing, no pressure.
            </li>
          </ol>
        </div>

        <div className="mt-10 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">In a hurry?</h2>
          <p className="mt-4 text-foreground/80">
            Visit the showroom — 360 Keewatin St, Winnipeg, MB — or email{" "}
            <a
              href="mailto:info@pkeeconstructions.ca"
              className="text-brass underline-offset-4 hover:underline"
            >
              info@pkeeconstructions.ca
            </a>{" "}
            and mention your reference number.
          </p>
        </div>

        <Link
          href="/products"
          className="mt-12 inline-flex h-14 items-center rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors hover:bg-charcoal"
        >
          Keep browsing materials
        </Link>
      </div>
    </div>
  );
}
