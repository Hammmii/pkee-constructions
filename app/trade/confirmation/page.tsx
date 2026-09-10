import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Application Received",
  robots: { index: false, follow: false },
};

const REFERENCE_PATTERN = /^DA-\d{4}-\d{4}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}'’\- ]{0,39}$/u;

/**
 * Post-submit landing. Only the reference number and the applicant's first
 * name are ever rendered — the DealerApplications collection is staff-only,
 * so nothing else is exposed publicly. The name travels in the query string
 * because the collection has no persisted reference column to look up.
 */
export default async function TradeConfirmationPage({
  searchParams,
}: PageProps<"/trade/confirmation">) {
  const { ref, name } = await searchParams;
  const reference = typeof ref === "string" && REFERENCE_PATTERN.test(ref) ? ref : null;
  const rawName = typeof name === "string" && NAME_PATTERN.test(name) ? name : null;
  const firstName = rawName?.trim().split(/\s+/)[0] ?? null;

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Application received</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          {firstName ? `Thank you, ${firstName}.` : "Thank you."}
        </h1>

        {reference ? (
          <>
            <p className="mt-6 text-foreground/60">Your application reference:</p>
            <p className="mt-2 inline-block border border-brass px-6 py-4 font-serif text-4xl tracking-wide text-brass">
              {reference}
            </p>
          </>
        ) : (
          <p className="mt-6 max-w-xl text-foreground/60">
            If you just submitted an application, we have it — a confirmation is on its way to your
            inbox.
          </p>
        )}

        <div className="mt-12 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">What happens next</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/80">
            <li>Our trade team reviews your business profile and any documents you attached.</li>
            <li>We respond within 2 business days — usually sooner.</li>
            <li>
              Approved dealers get trade pricing, priority stock, and territory terms — no published
              pricing, no pressure.
            </li>
          </ol>
        </div>

        <div className="mt-10 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">Questions in the meantime?</h2>
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
    </main>
  );
}
