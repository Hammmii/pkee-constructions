"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMounted, usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo

type ImageRevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner scaling wrapper (e.g. aspect ratio, fill). */
  innerClassName?: string;
};

/**
 * The signature material-site reveal: an overflow-hidden wrapper whose
 * clip-path opens on scroll while the inner media scales 1.15 → 1.
 * Animates only transform/clip-path — never layout properties.
 *
 * SSR contract: content renders unclipped and unscaled in the HTML;
 * animation engages only post-hydration and never under reduced motion.
 */
export function ImageReveal({ children, className, innerClassName }: ImageRevealProps) {
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();
  const animate = mounted && !reduced;

  if (!animate) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div className={cn("relative h-full w-full", innerClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: EXPO }}
    >
      <motion.div
        className={cn("relative h-full w-full will-change-transform", innerClassName)}
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.4, ease: EXPO }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
