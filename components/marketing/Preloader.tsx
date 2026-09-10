"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMounted, usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo
const STORAGE_KEY = "pkee-preloader-seen";
const COUNT_MS = 850;
const WIPE_MS = 600;

/**
 * Entry ritual: brass monogram + 0–100 counter, then a clip-path wipe exit.
 * Total choreography stays ≤ 1.5s. Skipped entirely on repeat visits
 * (sessionStorage) and under reduced motion — in both cases this renders
 * nothing and the page is immediately usable.
 */
export function Preloader() {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [exiting, setExiting] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!mounted || reduced) return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // storage unavailable — show the preloader once per mount instead
    }

    setActive(true);
    document.documentElement.style.overflow = "hidden";

    const finish = () => {
      setExiting(true);
      document.documentElement.style.overflow = "";
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore — repeat visits just see the preloader again
      }
    };

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS);
      // ease the counter so it decelerates like a real loader
      setCount(Math.round((1 - (1 - progress) ** 2) * 100));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.documentElement.style.overflow = "";
    };
  }, [mounted, reduced]);

  if (!mounted || reduced || !active) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink"
      initial={{ clipPath: "inset(0 0 0% 0)" }}
      animate={exiting ? { clipPath: "inset(0 0 100% 0)" } : { clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: WIPE_MS / 1000, ease: EXPO }}
      onAnimationComplete={() => {
        if (exiting) setActive(false);
      }}
    >
      <span className="font-serif text-6xl italic text-brass">P</span>
      <span className="mt-6 text-[color:var(--bone-on-ink)]">
        <span className="text-label">{count}</span>
        <span className="text-label text-[color:var(--bone-dim)]"> — 100</span>
      </span>
      <span className="mt-2 text-label text-[color:var(--bone-dim)]">PKEE Constructions</span>
    </motion.div>
  );
}
