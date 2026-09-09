import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  dark?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Shared chrome for the field family: floating tiny uppercase label,
 * bottom-border-only input region, inline error text (never a toast).
 */
export function FieldShell({
  id,
  label,
  error,
  dark = false,
  className,
  children,
}: FieldShellProps) {
  const errorId = `${id}-error`;
  return (
    <div className={cn("relative", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-label pointer-events-none absolute top-0 left-0",
          error ? "text-clay" : dark ? "text-[color:var(--bone-dim)]" : "text-ink/55",
        )}
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[0.8125rem] leading-snug text-clay">
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldInputClasses = (dark: boolean, hasError: boolean) =>
  cn(
    "w-full border-0 border-b bg-transparent pt-7 pb-3 text-base outline-none transition-colors duration-300",
    "focus:border-b-[1.5px] focus:border-brass",
    hasError
      ? "border-b-clay"
      : dark
        ? "border-b-[color:var(--line-on-dark)] text-[color:var(--bone-on-ink)]"
        : "border-b-ink/20 text-ink",
  );
