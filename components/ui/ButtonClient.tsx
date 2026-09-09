"use client";

import { type HTMLMotionProps, motion } from "motion/react";

type MotionButtonProps = HTMLMotionProps<"button"> & {
  children: React.ReactNode;
};

/**
 * Interactive half of `Button`: `whileTap` scale 0.97.
 * Hover fill is pure CSS (scaleY slide) so Button stays
 * server-compatible; only tap feedback needs the client.
 */
export function MotionButton({ children, type = "button", ...props }: MotionButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
