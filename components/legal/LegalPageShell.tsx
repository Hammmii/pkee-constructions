import type { ReactNode } from "react";
import { LegalDraftNotice } from "@/components/legal/LegalDraftNotice";

type LegalPageShellProps = {
  /** Small uppercase kicker above the H1. */
  eyebrow: string;
  title: string;
  /** Short intro paragraph under the title. */
  intro: ReactNode;
  /** ISO date string for "last updated". */
  updated: string;
  children: ReactNode;
};

/**
 * Shared hero + wrapper for the legal pages (privacy / terms / warranty).
 * Server component, zero client JS.
 */
export function LegalPageShell({ eyebrow, title, intro, updated, children }: LegalPageShellProps) {
  return (
    <div className="flex-1 bg-background">
      <LegalDraftNotice />
      <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-14 md:px-10 md:pt-24">
        <p className="text-label text-brass">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-foreground/60">{intro}</p>
        <p className="mt-6 text-xs uppercase tracking-[0.14em] text-ink/45">
          Last updated · {updated}
        </p>
      </section>
      {children}
    </div>
  );
}
