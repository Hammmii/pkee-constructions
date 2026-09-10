"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  useMounted,
  usePrefersReducedMotion,
} from "@/components/motion/use-prefers-reduced-motion";
import { Container } from "@/components/ui/Container";

export type AboutStat = { label: string; value: string };

type StatsBandProps = {
  stats: AboutStat[];
};

/**
 * Animated counters — same progressive-enhancement contract as the home
 * WhyChooseUs stats: SSR and reduced-motion users see the final value
 * immediately; everyone else gets a count-up on first view.
 */
export function StatsBand({ stats }: StatsBandProps) {
  if (stats.length === 0) return null;

  return (
    <section className="border-t rule bg-bone">
      <Container className="py-16 md:py-24">
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-3">
          {stats.map((stat) => (
            <Stat key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: AboutStat) {
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
      const eased = 1 - (1 - progress) ** 3;
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
