import type { Metadata } from "next";
import Link from "next/link";
import { TrackClick } from "@/components/analytics/TrackClick";
import { TradeApplication } from "@/components/trade/TradeApplication";
import { SpecRow } from "@/components/ui/SpecRow";
import { site, whatsappLink } from "@/lib/site";
import { tradeInquiryMessage } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Become a Dealer",
    description:
      "Apply to carry PKEE Constructions decorative building materials — trade pricing, priority stock, and territory support for retailers, contractors, and designers.",
  };
}

const PROGRAM_BENEFITS: Array<[string, string]> = [
  [
    "Range",
    "Full catalog access — led by our PVC wall panel program, WPC, SPC, louvres, and trims.",
  ],
  ["Pricing", "Trade-tier pricing on every order — no published rates, quoted to your volume."],
  ["Stock", "Priority allocation on fast movers and new arrivals before public release."],
  [
    "Territory",
    "Exclusivity reviewed per dealer program — we protect the partners who build the market.",
  ],
  ["Support", "Samples, spec sheets, and install guidance from the Winnipeg showroom team."],
];

const WHO_IT_SUITS = [
  {
    title: "Retailers & showrooms",
    body: "Put a differentiated wall and ceiling program on your floor, with displays and samples to close the sale.",
  },
  {
    title: "Contractors & builders",
    body: "Reliable supply and trade pricing across multi-unit and commercial runs — one account, one rep.",
  },
  {
    title: "Designers & architects",
    body: "Spec our ranges with confidence: real samples, real spec sheets, and a team that answers the phone.",
  },
];

export default function TradePage() {
  return (
    <div className="flex-1 bg-background">
      {/* Hero + value proposition */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 md:px-10 md:pt-28">
        <p className="text-label text-brass">Trade Program</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl italic text-ink md:text-6xl">
          Build your business on our range.
        </h1>
        <p className="mt-6 max-w-2xl text-foreground/60">
          PKEE Constructions supplies, fabricates, and installs premium decorative building
          materials from 360 Keewatin St, Winnipeg. Our dealer program gives trade partners the
          range, pricing, and stock priority to win wall and ceiling projects — apply below and our
          trade team responds within 2 business days.
        </p>
        <p className="mt-4 text-sm text-foreground/55">
          Questions first?{" "}
          <TrackClick
            event="whatsapp_click"
            source="trade"
            href={whatsappLink(tradeInquiryMessage())}
          >
            <a
              href={whatsappLink(tradeInquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with the ${site.name} trade desk on WhatsApp at ${site.whatsapp.display}`}
              className="text-brass underline-offset-4 hover:underline"
            >
              Chat with our trade desk on WhatsApp
            </a>
          </TrackClick>{" "}
          — replies within one business day.
        </p>
      </section>

      {/* Dealer program — SpecRow hairlines */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20 md:px-10">
        <h2 className="text-label text-ink/55">The dealer program</h2>
        <dl className="mt-4">
          {PROGRAM_BENEFITS.map(([label, value]) => (
            <SpecRow key={label} label={label} value={value} />
          ))}
        </dl>
      </section>

      {/* Who it suits */}
      <section className="border-t rule">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-20 sm:grid-cols-3 md:px-10">
          {WHO_IT_SUITS.map((item) => (
            <div key={item.title}>
              <h3 className="font-serif text-xl italic text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/60">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application wizard */}
      <section className="border-t rule">
        <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
          <p className="text-label text-brass">Dealer Application</p>
          <h2 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
            Apply in three steps.
          </h2>
          <p className="mt-4 max-w-xl text-foreground/60">
            Tell us about the business — three short steps, no pricing published online. Every
            application is reviewed by a person on the trade team.
          </p>

          <div className="mt-12">
            <TradeApplication
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
            />
          </div>
        </div>
      </section>

      {/* Reassurance */}
      <section className="border-t rule">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10">
          <h2 className="text-label text-ink/55">Prefer to talk first?</h2>
          <p className="mt-4 text-foreground/80">
            Visit the showroom — 360 Keewatin St, Winnipeg, MB — or email{" "}
            <a
              href="mailto:info@pkeeconstructions.ca"
              className="text-brass underline-offset-4 hover:underline"
            >
              info@pkeeconstructions.ca
            </a>{" "}
            and mention the trade program.
          </p>
          <Link
            href="/products"
            className="mt-10 inline-flex h-14 items-center rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors hover:bg-charcoal"
          >
            Browse the catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
