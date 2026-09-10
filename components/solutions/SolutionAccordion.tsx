"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type SolutionFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type SolutionAccordionProps = {
  items: SolutionFaqItem[];
};

/**
 * Accessible disclosure accordion for space FAQs. Buttons toggle their
 * panel with aria-expanded/aria-controls; only transform/opacity animate.
 * All panels start closed, so the SSR HTML matches the first render.
 */
export function SolutionAccordion({ items }: SolutionAccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="divide-y divide-[color:var(--line)] border-y border-[color:var(--line)]">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium tracking-tight text-ink transition-colors hover:text-brass"
              >
                {item.question}
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-brass transition-transform duration-300 ease-out",
                    isOpen && "rotate-45",
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <section
              id={panelId}
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="m-0 max-w-3xl pb-6 leading-relaxed text-ink/65">{item.answer}</p>
              </div>
            </section>
          </div>
        );
      })}
    </div>
  );
}
