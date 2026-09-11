import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppHandoff } from "@/components/lead/WhatsAppHandoff";

export const metadata: Metadata = {
  title: "Request Received",
  robots: { index: false, follow: false },
};

const NAME_PATTERN = /^[\p{L}][\p{L}'’\- ]{0,39}$/u;

/**
 * Post-submit landing. Only the uploader's first name is ever rendered —
 * the Consultations collection is staff-only, and it has no persisted
 * reference column, so no reference token is shown. The name travels in the
 * query string because there is nothing public to look it up by.
 */
export default async function CustomStudioConfirmationPage({
  searchParams,
}: PageProps<"/custom-studio/confirmation">) {
  const { name } = await searchParams;
  const rawName = typeof name === "string" && NAME_PATTERN.test(name) ? name : null;
  const firstName = rawName?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Request received</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          {firstName ? `Thank you, ${firstName}.` : "Thank you."}
        </h1>

        <p className="mt-6 max-w-xl text-foreground/60">
          Your design upload is with our Custom Studio team — we review every request personally and
          respond within 2 business days.
        </p>

        <WhatsAppHandoff
          formType="Custom Studio"
          reference={null}
          firstName={firstName}
          summaryLines={firstName ? [`Name: ${firstName}`] : []}
        />

        <div className="mt-12 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">What happens next</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/80">
            <li>Our designers review your brief and the reference files you attached.</li>
            <li>We respond within 2 business days — usually sooner — with next steps.</li>
            <li>
              You receive a quotation for the piece: no published pricing, no pressure, one custom
              design built to your measurements.
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
            and mention the Custom Studio.
          </p>
        </div>

        <Link
          href="/custom-studio"
          className="mt-12 inline-flex h-14 items-center rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors hover:bg-charcoal"
        >
          Back to the Custom Studio
        </Link>
      </div>
    </div>
  );
}
