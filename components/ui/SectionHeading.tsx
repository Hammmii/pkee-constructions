import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Two-digit editorial index, e.g. "01". Rendered in brass. */
  index?: string;
  /** Tiny uppercase kicker, e.g. "Material Library". */
  label?: string;
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  dark?: boolean;
  className?: string;
};

/**
 * Numbered editorial block: brass index numeral + tiny uppercase label
 * + display heading. Pass `<em>` children (rendered in the italic serif
 * accent) anywhere inside `children` for the genre's signature mix.
 */
export function SectionHeading({
  index,
  label,
  children,
  as: Tag = "h2",
  dark = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {(index ?? label) && (
        <div className="mb-6 flex items-center gap-4">
          {index && (
            <span aria-hidden className="font-serif text-sm italic text-brass">
              {index}
            </span>
          )}
          {index && label && (
            <span
              aria-hidden
              className={cn("h-px w-10", dark ? "bg-[color:var(--line-on-dark)]" : "bg-line")}
            />
          )}
          {label && (
            <span
              className={cn("text-label", dark ? "text-[color:var(--bone-on-ink)]" : "text-ink/60")}
            >
              {label}
            </span>
          )}
        </div>
      )}
      <Tag
        className={cn(
          "text-balance text-4xl leading-[0.95] font-medium tracking-tight md:text-5xl lg:text-6xl",
          dark ? "text-[color:var(--bone-on-ink)]" : "text-ink",
        )}
      >
        {children}
      </Tag>
    </div>
  );
}
