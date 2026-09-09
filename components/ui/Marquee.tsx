import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MarqueeTrack } from "./MarqueeTrack";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  dark?: boolean;
};

/**
 * One ticker, CSS-driven (`--animate-marquee`, translateX −50% loop).
 * Content is duplicated with an aria-hidden clone so assistive tech reads
 * it once; the clone pair must stay identical for a seamless loop.
 * Pauses off-screen via IntersectionObserver; static under reduced motion.
 */
export function Marquee({ children, className, dark = false }: MarqueeProps) {
  const group = "flex shrink-0 items-center";
  return (
    <div className={cn("overflow-hidden border-y py-5", dark ? "rule-on-dark" : "rule", className)}>
      <MarqueeTrack>
        <div className={group}>{children}</div>
        <div className={group} aria-hidden="true">
          {children}
        </div>
      </MarqueeTrack>
    </div>
  );
}
