import type { Metadata } from "next";
import Link from "next/link";
import { Track } from "@/components/analytics/Track";

export const metadata: Metadata = {
  title: "Sample Request Received",
  robots: { index: false, follow: false },
};

const REFERENCE_PATTERN = /^SR-\d{4}-\d{4}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}'’\- ]{0,39}$/u;

/**
 * Post-submit landing. Only the reference number and the customer's first
 * name are ever rendered — the SampleRequests collection is staff-only, so
 * nothing else is exposed publicly. The name travels in the query string
 * because the collection has no persisted reference column to look up.
 */
export default async function SamplesConfirmationPage({
  searchParams,
}: PageProps<"/samples/confirmation">) {
  const { ref, name } = await searchParams;
  const reference = typeof ref === "string" && REFERENCE_PATTERN.test(ref) ? ref : null;
  const rawName = typeof name === "string" && NAME_PATTERN.test(name) ? name : null;
  const firstName = rawName?.trim().split(/\s+/)[0] ?? null;

  return (
    <main className="flex-1 bg-background">
      <Track event="sample_request" properties={{ reference: reference ?? null }} />
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Request received</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          {firstName ? `Thank you, ${firstName}.` : "Thank you."}
        </h1>

        {reference ? (
          <>
            <p className="mt-6 text-foreground/60">Your sample request reference:</p>
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
            <li>A specialist confirms your samples and checks colour and finish availability.</li>
            <li>We ship within 2 business days — usually sooner.</li>
            <li>You test the material in your own light, then decide with confidence.</li>
          </ol>
        </div>

        <div className="mt-10 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">Want to go further?</h2>
          <p className="mt-4 text-foreground/80">
            <Link href="/quote" className="text-brass underline-offset-4 hover:underline">
              Request a quote
            </Link>{" "}
            or{" "}
            <Link href="/consultation" className="text-brass underline-offset-4 hover:underline">
              book a consultation
            </Link>{" "}
            with a specialist.
          </p>
        </div>
      </div>
    </main>
  );
}
