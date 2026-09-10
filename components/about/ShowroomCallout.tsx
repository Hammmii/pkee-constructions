import { MapEmbed } from "@/components/contact/MapEmbed";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import { Reveal } from "./Reveal";

/**
 * Showroom callout — address and hours from the single source of truth in
 * lib/site.ts, with a lazy-loaded map embed that only costs a request when
 * it scrolls near the viewport.
 */
export function ShowroomCallout() {
  return (
    <section className="border-t rule bg-bone">
      <Container className="py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-label text-brass">The Showroom</p>
              <h2 className="mt-6 text-balance text-4xl leading-[0.95] font-medium tracking-tight text-ink md:text-5xl">
                See it installed <em className="font-accent italic">before</em> you commit.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-foreground/60">
                Full-size wall, ceiling, and feature displays — installed the way we install them,
                so you can judge the real finish, not a sample chip.
              </p>
              <address className="mt-10 border-t rule pt-8 not-italic">
                <p className="text-lg font-medium text-ink">
                  {site.address.street}, {site.address.city}, {site.address.province}
                </p>
                <dl className="mt-6 space-y-2">
                  {site.hours.map((line) => {
                    const [days, ...rest] = line.split("·");
                    return (
                      <div key={line} className="flex items-baseline justify-between gap-6 text-sm">
                        <dt className="text-label text-ink/55">{days?.trim()}</dt>
                        <dd className="text-foreground/80">{rest.join("·").trim()}</dd>
                      </div>
                    );
                  })}
                </dl>
              </address>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="min-h-[20rem]">
            <MapEmbed className="h-full min-h-[20rem] w-full" />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
