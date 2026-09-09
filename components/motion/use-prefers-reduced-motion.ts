"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Central gate for every animation. SSR-safe: resolves to `false` during
 * prerender and on the first client render, then tracks the media query.
 * Components combine this with a mount check so content is never
 * hidden in the server-rendered HTML (animate-from-hidden only
 * post-hydration).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * True only after hydration — the companion gate that guarantees SSR
 * output renders fully visible and animations engage only on the client.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
