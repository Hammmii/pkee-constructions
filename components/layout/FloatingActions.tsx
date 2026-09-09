import Link from "next/link";
import { quoteCta, site } from "@/lib/site";

/**
 * Mobile-only sticky conversion bar: solid "Get a Quote" + click-to-call.
 * Hidden on desktop (`md:hidden`); the root layout adds a matching spacer so
 * the bar never obscures the footer's bottom line.
 */
export function FloatingActions() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="grid grid-cols-2 border-t rule bg-bone/95 backdrop-blur-md">
        <Link
          href={quoteCta.href}
          className="flex h-16 items-center justify-center bg-ink text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors duration-300 hover:text-brass"
        >
          Get a Quote
        </Link>
        <a
          href={site.phone.href}
          aria-label={`Call ${site.name} at ${site.phone.display}`}
          className="flex h-16 items-center justify-center gap-2.5 border-l rule text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors duration-300 hover:text-brass"
        >
          <svg
            aria-hidden
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call
        </a>
      </div>
    </div>
  );
}
