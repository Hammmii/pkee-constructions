import Image from "next/image";
import Link from "next/link";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { CapabilityCard } from "./home-types";

type CustomStudioTeaserProps = {
  capabilities: CapabilityCard[];
};

/**
 * Four Custom Studio capability cards (imagery pulled from the matching
 * seeded product-category heroes). Links point at /custom-studio per the
 * sitemap even though the route lands in a later milestone.
 */
export function CustomStudioTeaser({ capabilities }: CustomStudioTeaserProps) {
  if (capabilities.length === 0) return null;

  return (
    <section className="bg-ink py-20 md:py-28">
      <Container className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <SectionHeading index="09" label="Custom Studio" dark>
          Made to order, <em className="font-accent italic">made to measure</em>
        </SectionHeading>
        <Link
          href="/custom-studio"
          className="text-label text-[color:var(--bone-dim)] transition-colors duration-300 hover:text-brass"
        >
          Visit the Custom Studio →
        </Link>
      </Container>
      <Container>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability, i) => (
            <Link key={capability.title} href="/custom-studio" className="group block">
              <ImageReveal className="aspect-[4/5]">
                {capability.image?.url ? (
                  <Image
                    src={capability.image.url}
                    alt={capability.image.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-charcoal" aria-hidden="true" />
                )}
                <span
                  aria-hidden="true"
                  className="absolute top-4 left-4 font-serif text-sm italic text-bone/80"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </ImageReveal>
              <h3 className="mt-5 text-lg font-medium tracking-tight text-[color:var(--bone-on-ink)]">
                {capability.title}
              </h3>
              <span
                aria-hidden="true"
                className="mt-2 block h-px w-12 bg-brass transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
              />
              <p className="mt-3 text-sm leading-[1.6] text-[color:var(--bone-dim)]">
                {capability.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
