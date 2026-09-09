import { cn } from "@/lib/utils";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

/**
 * FAQ accordion as native <details>/<summary>: keyboard-operable, screen-
 * reader friendly, works without JS. Only the chevron rotates (transform).
 */
export function FaqAccordion({
  items,
  dark = false,
  className,
}: {
  items: FaqItem[];
  dark?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((faq) => (
        <details
          key={faq.id}
          className={cn("group border-t rule", dark && "rule-on-dark")}
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-medium outline-none transition-colors duration-300 [&::-webkit-details-marker]:hidden",
              dark
                ? "text-[color:var(--bone-on-ink)] hover:text-brass"
                : "text-ink hover:text-brass",
            )}
          >
            {faq.question}
            <span
              aria-hidden
              className={cn(
                "shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45",
                dark ? "text-brass" : "text-brass",
              )}
            >
              +
            </span>
          </summary>
          <p
            className={cn(
              "m-0 max-w-3xl pb-6 text-[0.95rem] leading-relaxed",
              dark ? "text-[color:var(--bone-dim)]" : "text-ink/65",
            )}
          >
            {faq.answer}
          </p>
        </details>
      ))}
      <div className={cn("border-t rule", dark && "rule-on-dark")} />
    </div>
  );
}
