"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMounted, usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo

type StaggerColumnProps = {
  children: ReactNode;
  /** Position in the grid — sets the reveal delay. */
  index: number;
  className?: string;
};

/**
 * Footer grid column that rises into view with a small stagger. Content is
 * fully visible in the SSR HTML; motion engages only post-hydration and
 * never under reduced motion.
 */
export function StaggerColumn({ children, index, className }: StaggerColumnProps) {
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();
  const animate = mounted && !reduced;

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: EXPO, delay: index * 0.08 }}
    >
      {children}
    </motion.div>
  );
}
