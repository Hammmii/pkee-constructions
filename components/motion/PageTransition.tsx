"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo
const WIPE_MS = 450;

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Dark overlay wipe + content crossfade on App Router pathname changes.
 * Total choreographed time stays under 600ms. Skipped entirely under
 * reduced motion and on first load (initial={false}).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: WIPE_MS / 1000, ease: EXPO }}
        >
          {children}
        </motion.div>
        {/* dark wipe: covers on exit, opens upward on enter */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 bg-ink"
          initial={{ clipPath: "inset(0 0 0 0)" }}
          animate={{ clipPath: "inset(0 0 100% 0)" }}
          exit={{ clipPath: "inset(0 0 0 0)" }}
          transition={{ duration: WIPE_MS / 1000, ease: EXPO }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
