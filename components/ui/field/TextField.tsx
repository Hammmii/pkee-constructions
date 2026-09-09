"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { FieldShell, fieldInputClasses } from "./FieldShell";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  dark?: boolean;
};

/**
 * Bottom-border-only input with a floating tiny uppercase label and inline
 * error. Spread RHF's `register(...)` onto it — the ref forwards and all
 * input attributes (autocomplete included) pass through.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, error, dark = false, className, ...inputProps },
  ref,
) {
  return (
    <FieldShell id={id} label={label} error={error} dark={dark} className={className}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldInputClasses(dark, Boolean(error))}
        {...inputProps}
      />
    </FieldShell>
  );
});
