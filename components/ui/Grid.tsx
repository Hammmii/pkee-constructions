import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GridProps = {
  children: ReactNode;
  className?: string;
  /** Items may intentionally bleed outside the column rhythm. */
  bleed?: boolean;
};

/** Editorial 12-column grid. Children span columns via `col-span-*` classes. */
export function Grid({ children, className, bleed = false }: GridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-x-6 gap-y-12 md:gap-x-8",
        bleed && "[&>*]:-mx-6 [&>*]:px-6 md:[&>*]:-mx-10 md:[&>*]:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
