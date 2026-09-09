"use client";

import { type ReactNode, useEffect, useRef } from "react";

type MarqueeTrackProps = {
  children: ReactNode;
};

/**
 * Drives the `--animate-marquee` CSS loop and pauses it while off-screen
 * via IntersectionObserver. The loop itself lives in globals.css
 * (transform-only translateX, 28s).
 */
export function MarqueeTrack({ children }: MarqueeTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        track.style.animationPlayState = entry?.isIntersecting ? "running" : "paused";
      },
      { threshold: 0 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={trackRef} className="flex w-max motion-safe:animate-marquee">
      {children}
    </div>
  );
}
