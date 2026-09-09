"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { gsap, initGsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

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

  useGSAP(
    () => {
      if (!lenis) return;

      initGsap();

      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      return () => {
        lenis.off("scroll", ScrollTrigger.update);
        gsap.ticker.remove(raf);
      };
    },
    { dependencies: [lenis] },
  );

  // App Router client navigations don't reset scroll natively under Lenis.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-running on every pathname change is the intent
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [lenis, pathname]);

  return children;
}
