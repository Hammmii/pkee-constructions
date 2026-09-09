"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpecRow } from "@/components/ui/SpecRow";
import { Container } from "@/components/ui/Container";
import { useMounted, usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";
import type { StatItem } from "./home-types";

const VALUE_PROPS: Array<[string, string]> = [
  ["One team, start to finish", "Supply, fabrication, and installation under one roof — no handoffs."],
  ["A real showroom", "See full-size installed displays at 360 Keewatin St before you commit."],
  ["Built for Manitoba", "Waterproof, fire-resistant options rated for basements and bathrooms."],
  ["Custom fabrication in-house", "CNC carving, book-matching, and 3D relief made to your design."],
  ["Trade support for pros", "Priority stock, trade pricing, and territory support for dealers."],
  ["Quote in one business day", "Detailed, no-pressure quotes — every project, every time."],
];

type WhyChooseUsProps = {
  /** From the Pages home statsBand block (seed placeholder figures). */
  stats: StatItem[];
};

/**
 * Six value props as hairline SpecRow rows, then a stats band whose numbers
 * count up on first view. Count-up is a progressive enhancement: SSR and
 * reduced-motion users see the final value immediately.
 */
export function WhyChooseUs({ stats }: WhyChooseUsProps) {
  return (
    <section className="bg-bone py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 md:gap-x-8">
          <div className="col-span-12 lg:col-span-5">
            <SectionHeading index="05" label="Why PKEE" className="lg:sticky lg:top-28">
              The difference is <em className="font-accent italic">in the details</em>
            </SectionHeading>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <dl>
              {VALUE_PROPS.map(([label, value]) => (
                <SpecRow key={label} label={label} value={value} />
              ))}
            </dl>
            <div className="rule border-t" aria-hidden="true" />
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="mt-16 grid grid-cols-1 gap-y-10 border-t pt-10 sm:grid-cols-3 md:mt-24">
            {stats.map((stat) => (
              <Stat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

function Stat({ label, value }: StatItem) {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!mounted || reduced || !inView) return;
    const match = /^([\d,]+)(.*)$/.exec(value);
    if (!match?.[1]) return; // non-numeric stat — render as-is
    const target = Number.parseInt(match[1].replace(/,/g, ""), 10);
    if (Number.isNaN(target)) return;
    const suffix = match[2] ?? "";
    const start = performance.now();
    const DURATION = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${Math.round(target * eased).toLocaleString("en-CA")}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, reduced, inView, value]);

  return (
    <div ref={ref}>
      <p className="text-5xl font-medium tracking-tight text-brass tabular-nums md:text-6xl">
        {display}
      </p>
      <p className="text-label mt-3 text-ink/55">{label}</p>
    </div>
  );
}
