"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { type PointerEvent, type ReactNode, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";

type MagneticProps = {
  children: ReactNode;
  /** Maximum displacement in px — kept inside the ±8–12px band. */
  cap?: number;
  className?: string;
};

/**
 * Pulls children toward the cursor on a spring (stiffness 180 / damping 15),
 * capped so the drift stays within the ±8–12px premium band. Disabled on
 * coarse pointers and under reduced motion — children pass through.
 */
export function Magnetic({ children, cap = 10, className }: MagneticProps) {
  const reduced = usePrefersReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFinePointer(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setFinePointer(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 15 });
  const springY = useSpring(y, { stiffness: 180, damping: 15 });

  if (!finePointer || reduced) {
    return <span className={className}>{children}</span>;
  }

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-cap, Math.min(cap, offsetX * 0.35)));
    y.set(Math.max(-cap, Math.min(cap, offsetY * 0.35)));
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.span>
  );
}
