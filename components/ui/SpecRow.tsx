import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpecRowProps = {
  /** Tiny uppercase label, left. */
  label: ReactNode;
  /** Value, right-aligned. Always real text — never an image. */
  value: ReactNode;
  dark?: boolean;
  className?: string;
};

/**
 * Hairline-divided definition-list row. Compose several inside a `<dl>`;
 * each row carries its own top hairline so the list draws itself.
 */
export function SpecRow({ label, value, dark = false, className }: SpecRowProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 border-t py-3.5",
        dark ? "rule-on-dark" : "rule",
        className,
      )}
    >
      <dt
        className={cn("text-label shrink-0", dark ? "text-[color:var(--bone-dim)]" : "text-ink/55")}
      >
        {label}
      </dt>
      <dd className={cn("text-right", dark ? "text-[color:var(--bone-on-ink)]" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}
