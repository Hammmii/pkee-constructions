"use client";

import { motion } from "motion/react";
import { Children, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMounted, usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo

type RevealProps = {
  /** Each direct child is treated as one headline line. */
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger between lines in seconds (default 0.08). */
  stagger?: number;
};

/**
 * Split-line headline reveal. Each child is wrapped in an overflow-hidden
 * container and its clip-path opens from `inset(0 0 100% 0)` with an expo
 * ease and a per-line stagger.
 *
 * SSR contract: lines render fully visible in the HTML; hidden initial
 * states apply only after hydration and never under reduced motion.
 */
export function Reveal({ children, as, className, stagger = 0.08 }: RevealProps) {
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();
  const Tag = (as ?? "h2") as ElementType;
  const lines = Children.toArray(children);
  const animate = mounted && !reduced;

  return (
    <Tag className={cn("m-0", className)}>
      {lines.map((line, i) =>
        animate ? (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: static line order
            key={i}
            className="block overflow-hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.9, ease: EXPO, delay: i * stagger }}
          >
            <span className="block">{line}</span>
          </motion.span>
        ) : (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static line order
            key={i}
            className="block overflow-hidden"
          >
            <span className="block">{line}</span>
          </span>
        ),
      )}
    </Tag>
  );
}
