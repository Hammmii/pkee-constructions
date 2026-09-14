import type { ReactNode } from "react";

type LegalSectionProps = {
  /** Small uppercase kicker above the heading. */
  eyebrow?: string;
  title: string;
  children: ReactNode;
};

/**
 * One numbered-style section of a legal page. Keeps the readable measure and
 * hairline rhythm consistent across privacy / terms / warranty.
 */
export function LegalSection({ eyebrow, title, children }: LegalSectionProps) {
  return (
    <section className="border-t rule">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:px-10">
        {eyebrow ? <p className="text-label text-brass">{eyebrow}</p> : null}
        <h2 className="mt-3 font-serif text-3xl italic text-ink md:text-4xl">{title}</h2>
        <div className="mt-6 space-y-4 text-[0.9375rem] leading-relaxed text-foreground/70">
          {children}
        </div>
      </div>
    </section>
  );
}
