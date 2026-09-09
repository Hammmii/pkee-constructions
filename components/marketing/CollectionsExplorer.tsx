"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { gsap, initGsap, useGSAP } from "@/lib/gsap";
import { usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";
import type { CategoryCard } from "./home-types";

type CollectionsExplorerProps = {
  categories: CategoryCard[];
};

/**
 * The one pinned horizontal-scroll section of the page (product families).
 * Desktop: GSAP pins the section and scrubs the card track sideways.
 * Mobile: native horizontal snap scroll — no pin, no scroll trap. A skip
 * link to the full catalog is always present. Reduced-motion users get a
 * freely scrollable track with no pinning.
 */
export function CollectionsExplorer({ categories }: CollectionsExplorerProps) {
  const scope = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      initGsap();
      const track = trackRef.current;
      const section = scope.current;
      if (!track || !section) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope, dependencies: [reduced] },
  );

  return (
    <section ref={scope} className="overflow-hidden bg-ink py-20 md:py-28">
      <Container className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <SectionHeading index="02" label="Collections" dark>
          Browse by <em className="font-accent italic">material family</em>
        </SectionHeading>
        <Link
          href="/products"
          className="text-label text-[color:var(--bone-dim)] transition-colors duration-300 hover:text-brass"
        >
          View all materials →
        </Link>
      </Container>

      <div className="md:overflow-hidden">
        <div
          ref={trackRef}
          className="flex w-max snap-x snap-mandatory gap-5 overflow-x-auto px-6 md:w-max md:snap-none md:overflow-visible md:px-10 md:will-change-transform"
        >
          {categories.map((category, i) => (
            <Link
              key={category.slug}
              href={`/products/${category.slug}`}
              className="group w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw] lg:w-[24vw] xl:w-[21vw]"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {category.image?.url ? (
                  <Image
                    src={category.image.url}
                    alt={category.image.alt}
                    fill
                    sizes="(min-width: 1280px) 21vw, (min-width: 768px) 30vw, 72vw"
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
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium tracking-tight text-[color:var(--bone-on-ink)]">
                  {category.name}
                </h3>
                <span
                  aria-hidden="true"
                  className="mt-2 block h-px w-12 bg-brass transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
