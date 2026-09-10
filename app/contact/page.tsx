import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { SpecRow } from "@/components/ui/SpecRow";
import { directionsUrl, mailtoHref, phoneHref } from "@/lib/contact";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact PKEE Constructions — visit the showroom at 360 Keewatin St, Winnipeg, MB, call, email, or send a message. Consultations, quotes, and trade enquiries.",
};

const actionBase =
  "inline-flex h-14 select-none items-center justify-center rounded-[2px] px-8 " +
  "text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors duration-500";
const actionSolid = `${actionBase} bg-ink text-bone hover:bg-charcoal`;
const actionGhost = `${actionBase} border border-stone text-ink hover:border-ink`;

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const sent = sp.sent === "1";

  return (
    <main className="flex-1 bg-background pt-[var(--header-h)]">
      {/* Header */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-16 md:px-10 md:pt-24">
        <p className="text-label text-brass">Contact</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl italic text-ink md:text-6xl">
          Talk to the showroom.
        </h1>
        <p className="mt-6 max-w-2xl text-foreground/60">
          Questions about a material, a quote, or a project — send a message and a person from the
          Winnipeg team responds within one business day.
        </p>
      </section>

      <div className="border-t rule">
        <div className="mx-auto grid w-full max-w-5xl gap-16 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-5">
          {/* Location card */}
          <aside className="lg:col-span-2">
            <h2 className="text-label text-ink/55">The Showroom</h2>
            <address className="mt-6 not-italic">
              <p className="text-lg font-medium text-ink">
                {site.address.street}, {site.address.city}, {site.address.province}
              </p>
              <dl className="mt-8">
                {site.hours.map((line) => {
                  const [days, ...rest] = line.split("·");
                  return (
                    <SpecRow
                      key={line}
                      label={days?.trim() ?? line}
                      value={rest.length > 0 ? rest.join("·").trim() : "—"}
                    />
                  );
                })}
                <SpecRow label="Phone" value={site.phone.display} />
                <SpecRow label="Email" value={site.email} />
              </dl>
            </address>

            <div className="mt-10 flex flex-wrap gap-4">
              <a href={phoneHref()} className={actionSolid}>
                Call {site.phone.display}
              </a>
              <a href={mailtoHref()} className={actionGhost}>
                Email us
              </a>
            </div>
            <a
              href={directionsUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block text-sm text-brass underline-offset-4 hover:underline"
            >
              Get directions →
            </a>

            <div className="mt-10 aspect-[4/3] w-full">
              <MapEmbed className="h-full w-full" />
            </div>
          </aside>

          {/* Form / success state */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="border border-brass/50 px-8 py-12">
                <p className="text-label text-brass">Message sent</p>
                <h2 className="mt-4 font-serif text-4xl italic text-ink">Thank you.</h2>
                <p className="mt-4 max-w-md leading-relaxed text-foreground/60">
                  Your message is with the showroom team — we respond within one business day. For
                  anything urgent, call {site.phone.display}.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/products" className={actionSolid}>
                    Browse the catalog
                  </Link>
                  <Link href="/contact" className={actionGhost}>
                    Send another message
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-label text-ink/55">Send a Message</h2>
                <div className="mt-6">
                  <ContactForm
                    turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
