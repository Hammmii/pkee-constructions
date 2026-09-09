import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  /** Full-bleed: drops the max-width and gutters for intentional bleed. */
  bleed?: boolean;
};

export function Container({ children, className, bleed = false }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 md:px-10",
        bleed ? "max-w-none" : "max-w-[90rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}
