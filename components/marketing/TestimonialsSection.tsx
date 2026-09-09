"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import type { TestimonialItem } from "./home-types";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo

function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="text-sm tracking-[0.3em] text-brass"
    >
      {"★".repeat(rating)}
      <span className="text-[color:var(--line)]">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

/**
 * Manual crossfade between featured testimonials — no auto-advance, ever.
 * Prev/next controls are real buttons; the quote panel is a polite opacity
 * crossfade with a tiny stagger on the attribution.
 */
export function TestimonialsSection({ testimonials }: { testimonials: TestimonialItem[] }) {
  const [index, setIndex] = useState(0);
  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  if (!current) return null;

  const go = (direction: 1 | -1) => {
    setIndex((i) => (i + direction + testimonials.length) % testimonials.length);
  };

  return (
    <section className="bg-bone py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 md:gap-x-8">
          <div className="col-span-12 md:col-span-4">
            <SectionHeading index="10" label="Kind Words">
              From our <em className="font-accent italic">clients</em>
            </SectionHeading>
            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="flex h-12 w-12 items-center justify-center border border-stone text-ink transition-colors duration-300 hover:border-brass hover:text-brass"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="flex h-12 w-12 items-center justify-center border border-stone text-ink transition-colors duration-300 hover:border-brass hover:text-brass"
              >
                →
              </button>
              <span className="text-label ml-3 text-ink/55 tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="relative col-span-12 min-h-[16rem] md:col-span-7 md:col-start-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.blockquote
                key={`${current.name}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EXPO }}
              >
                <Stars rating={current.rating} />
                <p className="mt-6 text-2xl leading-[1.35] font-medium tracking-tight text-ink md:text-3xl">
                  &ldquo;{current.text}&rdquo;
                </p>
                <footer className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <motion.cite
                    className="text-label not-italic text-ink"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EXPO, delay: 0.12 }}
                  >
                    {current.name}
                  </motion.cite>
                  {current.location ? (
                    <span className="text-label text-ink/55">{current.location}</span>
                  ) : null}
                  {current.verified ? (
                    <span className="text-label text-brass">✓ Verified project</span>
                  ) : null}
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
