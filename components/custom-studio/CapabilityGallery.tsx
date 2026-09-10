import Image from "next/image";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type StudioCapability = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  /** Resolved category hero (CMS-driven); null = seeded imagery not available yet. */
  image: { url: string; alt: string } | null;
};

/**
 * Editorial capability gallery — one numbered, ImageReveal-led block per
 * Custom Studio capability. Imagery is CMS-driven: the first matching
 * ProductCategory hero is used, with a charcoal placeholder block when a
 * category isn't seeded yet (never an image of text).
 */
export function CapabilityGallery({ capabilities }: { capabilities: StudioCapability[] }) {
  return (
    <section className="border-t rule">
      <Container className="py-20 md:py-28">
        <SectionHeading index="01" label="Capabilities">
          Six ways we make it <em className="font-accent italic">yours</em>
        </SectionHeading>
        <div className="mt-16 space-y-24 md:space-y-32">
          {capabilities.map((capability, index) => {
            const flipped = index % 2 === 1;
            return (
              <div
                key={capability.slug}
                className="grid items-center gap-10 md:grid-cols-12 md:gap-16"
              >
                <div className={flipped ? "md:order-2 md:col-span-7" : "md:col-span-7"}>
                  <ImageReveal className="aspect-[4/3]">
                    {capability.image ? (
                      <Image
                        src={capability.image.url}
                        alt={capability.image.alt}
                        fill
                        sizes="(min-width: 768px) 58vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-charcoal" aria-hidden="true" />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute top-4 left-4 font-serif text-sm italic text-bone/80"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </ImageReveal>
                </div>
                <div className={flipped ? "md:order-1 md:col-span-5" : "md:col-span-5"}>
                  <p className="text-label text-brass">{capability.eyebrow}</p>
                  <h3 className="mt-4 font-serif text-3xl italic text-ink md:text-4xl">
                    {capability.title}
                  </h3>
                  <span aria-hidden="true" className="mt-6 block h-px w-12 bg-brass" />
                  <p className="mt-6 text-sm leading-[1.7] text-ink/60">{capability.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
