import type { Metadata } from "next";
import Link from "next/link";
import { TrackClick } from "@/components/analytics/TrackClick";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { WhatsAppHandoff } from "@/components/lead/WhatsAppHandoff";
import { SpecRow } from "@/components/ui/SpecRow";
import { directionsUrl, mailtoHref, phoneHref } from "@/lib/contact";
import { site, whatsappLink } from "@/lib/site";
import { genericInquiryMessage } from "@/lib/whatsapp";

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

const NAME_PATTERN = /^[\p{L}][\p{L}'’\- ]{0,39}$/u;

const whatsappHref = whatsappLink(genericInquiryMessage());

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
  const rawName = typeof sp.name === "string" && NAME_PATTERN.test(sp.name) ? sp.name : null;
  const firstName = rawName?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="flex-1 bg-background pt-[var(--header-h)]">
      {/* Header */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-16 md:px-10 md:pt-24">
        <p className="text-label text-brass">Contact</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl italic text-ink md:text-6xl">
          Talk to the showroom.
        </h1>
        <p className="mt-6 max-w-2xl text-foreground/60">
          Questions about a material, a quote, or a project — send a message or chat on WhatsApp and
          a person from the Winnipeg team responds within one business day.
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
                <SpecRow label="WhatsApp" value={site.whatsapp.display} />
                <SpecRow label="Email" value={site.email} />
              </dl>
            </address>

            <div className="mt-10 flex flex-wrap gap-4">
              <TrackClick event="whatsapp_click" source="contact" href={whatsappHref}>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${site.name} on WhatsApp at ${site.whatsapp.display}`}
                  className={`${actionSolid} gap-3`}
                >
                  <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
                  </svg>
                  Chat with us on WhatsApp
                </a>
              </TrackClick>
              <TrackClick event="phone_click" source="contact" href={phoneHref()}>
                <a href={phoneHref()} className={actionGhost}>
                  Call {site.phone.display}
                </a>
              </TrackClick>
              <TrackClick event="email_click" source="contact" href={mailtoHref()}>
                <a href={mailtoHref()} className={actionGhost}>
                  Email us
                </a>
              </TrackClick>
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
                  Your message is with the showroom team — we typically reply on WhatsApp within one
                  business day ({site.whatsappReplyWindow}). For anything urgent, call{" "}
                  {site.phone.display}.
                </p>
                <div className="mt-8">
                  <WhatsAppHandoff
                    formType="contact"
                    reference={null}
                    firstName={firstName}
                    summaryLines={firstName ? [`Name: ${firstName}`] : []}
                  />
                </div>
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
    </div>
  );
}
