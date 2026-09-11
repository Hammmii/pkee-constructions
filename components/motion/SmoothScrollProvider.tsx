"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

/**
 * Single source of smooth scrolling for the site. Lenis owns the wheel;
 * GSAP's ticker drives Lenis's raf so ScrollTrigger stays in lockstep
 * (the canonical GSAP↔Lenis sync, registered here and nowhere else).
 *
 * `autoRaf` stays off because the canonical sync feeds `lenis.raf` from
 * `gsap.ticker` — enabling both would double-step every frame.
 *
 * GSAP is imported dynamically inside the effect, not at module top level,
 * so the ~116 KB gsap/ScrollTrigger chunk stays out of the initial shared
 * bundle and out of every page's critical path.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        anchors: true,
        autoRaf: false,
        stopInertiaOnNavigate: true,
      }}
    >
      <GsapLenisSync>{children}</GsapLenisSync>
    </ReactLenis>
  );
}

function GsapLenisSync({ children }: SmoothScrollProviderProps) {
  const lenis = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    if (!lenis) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void import("@/lib/gsap").then(({ gsap, initGsap, ScrollTrigger }) => {
      if (cancelled) return;
      initGsap();

      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        lenis.off("scroll", ScrollTrigger.update);
        gsap.ticker.remove(raf);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [lenis]);

  // App Router client navigations don't reset scroll natively under Lenis.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-running on every pathname change is the intent
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [lenis, pathname]);

  return children;
}
