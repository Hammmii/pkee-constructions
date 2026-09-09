"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { FieldShell, fieldInputClasses } from "./FieldShell";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  error?: string;
  dark?: boolean;
  children: React.ReactNode;
};

/** Select sibling of TextField — native <select>, same chrome and contract. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { id, label, error, dark = false, className, children, ...selectProps },
  ref,
) {
  return (
    <FieldShell id={id} label={label} error={error} dark={dark} className={className}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldInputClasses(dark, Boolean(error))}
        {...selectProps}
      >
        {children}
      </select>
    </FieldShell>
  );
});
