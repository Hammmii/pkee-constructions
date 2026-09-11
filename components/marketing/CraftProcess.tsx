"use client";

import Image from "next/image";
import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gsap, initGsap, useGSAP } from "@/lib/gsap";
import { usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";
import type { HomeMedia } from "./home-types";

const STEPS: Array<[string, string]> = [
  ["01 — Consult & measure", "We visit your space (or your plans) and measure twice."],
  ["02 — Design & sample", "Materials, finishes, and lighting composed — samples in hand."],
  ["03 — Fabricate", "CNC carving, book-matching, and cutting in our own shop."],
  ["04 — Install & support", "One crew installs; we stand behind the finish."],
];

type CraftProcessProps = {
  /** Seeded project imagery for the scrub column (hero + detail). */
  primary: HomeMedia;
  secondary: HomeMedia;
};

/**
 * Sticky-left narrative: the text column pins while the right imagery
 * drifts past on a gentle parallax (transform-only, ±5% so total travel
 * stays ≤ 10%, desktop and no-preference only — mobile and reduced-motion
 * get a static stack).
 */
export function CraftProcess({ primary, secondary }: CraftProcessProps) {
  const scope = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      initGsap();
      const images = gsap.utils.toArray<HTMLElement>("[data-parallax]", scope.current);
      if (images.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const tweens = images.map((img) =>
          gsap.fromTo(
            img,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: "none",
              scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: 1 },
            },
          ),
        );
        return () => {
          for (const tween of tweens) tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope, dependencies: [reduced] },
  );

  return (
    <section ref={scope} className="bg-ink py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 md:gap-x-8">
          <div className="col-span-12 md:col-span-5">
            <div className="md:sticky md:top-28">
              <SectionHeading index="06" label="Craft" dark>
                From raw wall to <em className="font-accent italic">finished statement</em>
              </SectionHeading>
              <p className="mt-8 max-w-md text-sm leading-[1.6] text-[color:var(--bone-dim)]">
                Every project runs through the same four hands-on stages. Because we supply,
                fabricate, and install, nothing is lost between trades — the wall you approved is
                the wall you get.
              </p>
              <dl className="mt-10">
                {STEPS.map(([label, value]) => (
                  <div key={label} className="rule-on-dark border-t py-4">
                    <dt className="text-label text-brass">{label}</dt>
                    <dd className="mt-1.5 text-sm text-[color:var(--bone-on-ink)]">{value}</dd>
                  </div>
                ))}
                <div className="rule-on-dark border-t" aria-hidden="true" />
              </dl>
            </div>
          </div>

          <div className="col-span-12 flex flex-col gap-10 md:col-span-6 md:col-start-7">
            {/* The same media asset can back both slides (project hero reused as
                gallery image) — dedupe so React keys stay unique. */}
            {[primary, secondary]
              .filter(
                (image, i, all) =>
                  image?.url != null && all.findIndex((other) => other?.url === image.url) === i,
              )
              .map(
                (image, i) =>
                  image?.url && (
                    <div key={image.url} className={i % 2 === 1 ? "md:mt-24" : ""}>
                      <div className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4]">
                        <div
                          data-parallax
                          className="absolute -inset-y-[6%] inset-x-0 will-change-transform"
                        >
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            sizes="(min-width: 768px) 45vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  ),
              )}
          </div>
        </div>
      </Container>
    </section>
  );
}
