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
      <div className="grid grid-cols-3 border-t rule bg-bone/95 backdrop-blur-md">
        <Link
          href={quoteCta.href}
          className="flex h-16 items-center justify-center bg-ink text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors duration-300 hover:text-brass"
        >
          Get a Quote
        </Link>
        <a
          href={site.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with ${site.name} on WhatsApp at ${site.whatsapp.display}`}
          className="flex h-16 items-center justify-center gap-2.5 border-l rule text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors duration-300 hover:text-brass"
        >
          <svg
            aria-hidden
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
          </svg>
          WhatsApp
        </a>
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
