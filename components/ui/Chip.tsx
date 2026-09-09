import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  /** Brass ring marks the active/selected state. */
  active?: boolean;
  dark?: boolean;
  className?: string;
};

/**
 * Application / filter chip. Presentational by design — pair with your
 * own button wrapper (or filter state) for interactivity; active state
 * is a thin brass ring, never a filled chip.
 */
export function Chip({ children, active = false, dark = false, className }: ChipProps) {
  return (
    <span
      data-active={active || undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-[2px] border px-4 text-[0.8125rem] tracking-[0.08em] uppercase transition-colors duration-300",
        dark
          ? "border-[color:var(--line-on-dark)] text-[color:var(--bone-on-ink)]"
          : "border-stone text-ink/70",
        active && "border-brass text-brass ring-1 ring-brass",
        className,
      )}
    >
      {children}
    </span>
  );
}
