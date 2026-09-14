"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * GET form that submits itself whenever a control changes. Falls back to a
 * normal submit button when JS is unavailable.
 */
export function AutoSubmitForm({ children }: Props) {
  return (
    <form
      className="pk-filters"
      method="get"
      onChange={(e) => {
        e.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
