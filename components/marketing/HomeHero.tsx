"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { useMounted, usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";
import type { HomeMedia } from "./home-types";

type HomeHeroProps = {
  image: HomeMedia;
  /** CMS subheading from the Pages home hero block (seed placeholder copy). */
  subtext: string | null;
};

const DEFAULT_SUBTEXT =
  "Premium decorative building materials — supplied, fabricated, and installed by one Winnipeg team. PVC wall panels, stone, and custom fabrication at 360 Keewatin St.";

/**
 * 100svh full-bleed hero. The LCP element is a plain `next/image` with
 * `priority` + `fetchPriority="high"`; the Ken Burns drift (scale 1 → 1.08
 * over 8s) and the split-line headline are progressive enhancements gated
 * behind mount + reduced-motion. Display type sits bottom-left.
 */
export function HomeHero({ image, subtext }: HomeHeroProps) {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const animate = mounted && !reduced;

  return (
    <section className="relative flex h-[100svh] min-h-[36rem] w-full flex-col justify-end overflow-hidden bg-ink">
      {/* backdrop: LCP image + warm grade */}
      <div className="absolute inset-0">
        {image?.url ? (
          <motion.div
            className="absolute inset-0 will-change-transform"
            initial={animate ? { scale: 1 } : false}
            animate={animate ? { scale: 1.08 } : undefined}
            transition={{ duration: 8, ease: "linear" }}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        ) : null}
        {/* legibility grade — opacity/gradient only, no blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
      </div>

      <div className="relative mx-auto w-full max-w-[90rem] px-6 pb-24 md:px-10 md:pb-28">
        <p className="text-label mb-6 text-bone/80">
          <span className="mr-4 text-brass">01</span>
          PKEE Constructions — Winnipeg
        </p>
        <Reveal
          as="h1"
          className="max-w-5xl text-[clamp(2.75rem,8.5vw,7.5rem)] leading-[0.95] font-medium tracking-tight text-[color:var(--bone-on-ink)]"
        >
          <span>Materials that turn</span>
          <span>
            {"spaces into "}
            <em className="font-accent italic">statements</em>
          </span>
        </Reveal>
        <p className="mt-8 max-w-xl text-base leading-[1.6] text-[color:var(--bone-dim)] md:text-lg">
          {subtext ?? DEFAULT_SUBTEXT}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button href="/products" dark>
            Explore Materials
            <span aria-hidden="true">→</span>
          </Button>
          <Button href="/quote" variant="ghost" dark>
            Start Your Project
          </Button>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        aria-hidden="true"
        className="absolute right-6 bottom-8 hidden flex-col items-center gap-3 md:right-10 md:flex"
        initial={false}
        animate={animate ? { opacity: [0.9, 0.35, 0.9] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-label text-[color:var(--bone-dim)]">Scroll</span>
        <span className="h-14 w-px bg-gradient-to-b from-bone/70 to-transparent" />
      </motion.div>
    </section>
  );
}
