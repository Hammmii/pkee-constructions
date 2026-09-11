"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type TypeFillImage = { url: string | null; alt: string } | null;

/**
 * R2.3 — kinetic type statement (motion-spec §10 add): a full-bleed ink band
 * whose giant display line is filled with a material texture via
 * `background-clip: text`. On scroll, a single wrapper scrubs a solid fill
 * across the line left → right (clip-path on ONE wrapper, rAF-throttled,
 * eased ~900ms expo per §10). No per-letter splits — ever.
 *
 * Progressive enhancement: SSR/no-JS renders the final state (solid filled
 * text, fully visible); hydration resets to the texture state and scrubs in.
 * Reduced motion → static filled text, no scrub.
 */
export function TypeFillSection({ image }: { image: TypeFillImage }) {
  const reduced = usePrefersReducedMotion();
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const fill = fillRef.current;
    if (!fill) return;

    // Reset to the texture-only state; the solid fill scrubs in with scroll.
    fill.style.clipPath = "inset(-2% 100% -2% 0)";

    let raf = 0;
    let current = 0; // eased progress
    let target = 0;
    let done = false;

    const measure = () => {
      const rect = fill.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const vh = window.innerHeight;
      // Starts when the band enters the lower viewport, completes by ~35% up.
      const raw = (vh * 0.9 - rect.top) / (vh * 0.55);
      target = Math.min(1, Math.max(0, raw));
    };

    const tick = () => {
      // ~900ms expo convergence toward the scroll target (§10 timing).
      current += (target - current) * 0.12;
      if (target === 1 && target - current < 0.002) {
        current = 1;
        done = true;
      }
      fill.style.clipPath = `inset(-2% ${(1 - current) * 100}% -2% 0)`;
      if (!done) {
        raf = requestAnimationFrame(tick);
      } else {
        fill.style.clipPath = "none";
        window.removeEventListener("scroll", onScroll);
      }
    };

    const onScroll = () => {
      if (done) return;
      measure();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    measure();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      // Restore the SSR final state — a mid-scrub reduced-motion flip or
      // effect re-run must never leave the text stuck texture-only.
      fill.style.clipPath = "none";
    };
  }, [reduced]);

  const textureStyle: React.CSSProperties = image?.url
    ? {
        backgroundImage: `url(${image.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        // CMS texture missing — brass→clay gradient keeps the moment on-brand.
        backgroundImage: "linear-gradient(120deg, var(--brass), var(--clay) 55%, var(--stone))",
      };

  return (
    <section aria-label="Brand statement" className="bg-ink py-24 md:py-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 md:px-10">
        <p className="text-label text-brass">Why PKEE</p>
        <div className="relative mt-6">
          {/* Texture pass — the material lives inside the letterforms. */}
          <div
            aria-hidden
            className="bg-clip-text text-transparent typefill-line"
            style={textureStyle}
          >
            <TypeFillLine />
          </div>
          {/* Solid fill pass — clip-path scrubs left → right on ONE wrapper.
              This is the accessible heading; the texture pass is decorative. */}
          <div
            ref={fillRef}
            className="absolute inset-0"
            style={{ clipPath: "inset(-2% 0% -2% 0)" }}
          >
            <h2 className="text-bone typefill-line">
              <TypeFillLine />
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Statement line — TODO-CLIENT: confirm final brand copy before launch.
   Kept as one component so both passes stay identical. */
function TypeFillLine() {
  return (
    <>
      Materials that <em className="font-accent">outlast</em>
      <br />
      trends.
    </>
  );
}
