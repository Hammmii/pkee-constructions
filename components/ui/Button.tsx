import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MotionButton } from "./ButtonClient";

type ButtonProps = {
  children: ReactNode;
  /** Internal route — renders next/link. */
  href?: string;
  type?: "button" | "submit";
  variant?: "solid" | "ghost";
  /** For ink sections: inverts text/fill colors. */
  dark?: boolean;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

const base =
  "group relative inline-flex h-14 select-none items-center justify-center overflow-hidden rounded-[2px] px-8 " +
  "text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors duration-500";

const fill =
  "absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100";

/**
 * Two variants only: solid ink on bone, ghost with a 1px stone border.
 * The hover fill slides in via scaleY (never a color flash), height is
 * 54px (52–56 band), one radius site-wide (2px). Pass `href` for a
 * link, otherwise a tap-scaling <button> is rendered.
 */
export function Button({
  children,
  href,
  type = "button",
  variant = "solid",
  dark = false,
  className,
  disabled,
  ...aria
}: ButtonProps) {
  const content = (
    <>
      <span aria-hidden data-fill className={fill} />
      <span className="relative z-10 inline-flex items-center gap-3">{children}</span>
    </>
  );

  const classes = cn(
    base,
    variant === "solid" &&
      (dark
        ? "bg-bone text-ink hover:text-bone [&>span[data-fill]]:bg-ink"
        : "bg-ink text-bone hover:text-ink [&>span[data-fill]]:bg-bone"),
    variant === "ghost" &&
      (dark
        ? "border-[color:var(--line-on-dark)] text-bone hover:text-ink [&>span[data-fill]]:bg-bone"
        : "border-stone text-ink hover:text-bone [&>span[data-fill]]:bg-ink"),
    disabled && "pointer-events-none opacity-50",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...aria}>
        {content}
      </Link>
    );
  }

  return (
    <MotionButton className={classes} type={type} disabled={disabled} {...aria}>
      {content}
    </MotionButton>
  );
}
