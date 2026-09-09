"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { FieldShell, fieldInputClasses } from "./FieldShell";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
  dark?: boolean;
};

/** Textarea sibling of TextField — same chrome, same RHF contract. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { id, label, error, dark = false, className, rows = 4, ...textareaProps },
    ref,
  ) {
    return (
      <FieldShell id={id} label={label} error={error} dark={dark} className={className}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={fieldInputClasses(dark, Boolean(error))}
          {...textareaProps}
        />
      </FieldShell>
    );
  },
);
