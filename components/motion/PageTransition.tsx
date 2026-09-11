"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMounted, usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import { supportsViewTransitions, ViewTransition } from "./view-transition";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo
const WIPE_MS = 450;

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Route-change motion, R2.1 (motion-spec §6/§9):
 *
 * - View Transitions supported → a `<ViewTransition>` wrapper around the
 *   route children gives a subtle 300ms crossfade (`.pkee-page` in
 *   globals.css). The header is pinned via its own `pkee-header`
 *   view-transition-name. Never both systems on one navigation.
 * - No VT support (feature-detect) → the original ink-wipe
 *   `AnimatePresence mode="wait"` fallback (§6), engaged only after mount
 *   so the server HTML (which cannot know client support) and the first
 *   client render stay structurally identical — no hydration mismatch.
 * - Reduced motion → children render with no transition of any kind; the
 *   CSS reduced-motion block also collapses any VT animation to 1ms.
 *
 * The VT wrapper must be the first node of its (page) tree; it lives here
 * around `<main>` rather than around the persistent layout chrome.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();

  // Pre-mount (SSR + hydration): render the VT shape — it adds no wrapper
  // DOM (name="auto" lands on the child), matching on both sides.
  if (!mounted || (supportsViewTransitions() && !reduced)) {
    return <ViewTransition default="pkee-page">{children}</ViewTransition>;
  }

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
