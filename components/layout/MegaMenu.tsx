"use client";

import Image from "next/image";
import Link from "next/link";
import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRef } from "react";
import { megaQuickLinks } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { MegaCategory } from "./types";

type MegaMenuProps = {
  open: boolean;
  categories: MegaCategory[];
  /** Hover-intent callbacks owned by the header (trigger + panel share timers). */
  onEnter: () => void;
  onLeave: () => void;
  onCancelLeave: () => void;
  /** Immediate close (Esc / link click) — the header returns focus to the trigger. */
  onClose: () => void;
};

/**
 * Products mega-menu: an image-tile grid per product family (never a bare
 * text list), with a quick-links footer row.
 *
 * The header owns open state and hover intent; this component renders the
 * panel and its keyboard model: Esc closes (focus back to the trigger via
 * `onClose`), Arrow keys rove across links, Home/End jump, Tab is trapped
 * while open. Everything animates transform | opacity | visibility — the
 * last keeps closed-panel links out of the tab order — and the always-mounted
 * panel keeps SSR output and focus behavior stable. Reduced-motion CSS
 * flushes the transition instantly.
 */
export function MegaMenu({
  open,
  categories,
  onEnter,
  onLeave,
  onCancelLeave,
  onClose,
}: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const focusables = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);

  const focusAt = (index: number) => {
    const items = focusables();
    if (items.length === 0) return;
    const clamped = (index + items.length) % items.length;
    items[clamped]?.focus();
  };

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = focusables();
    const current = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case "Tab": {
        // Focus trap: Tab cycles inside the panel while it is open.
        if (items.length === 0) break;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        break;
      }
    }
  };

  const onPanelFocusOut = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onLeave();
    }
  };

  return (
    <div
      id="mega-menu"
      ref={panelRef}
      role="group"
      aria-label="Product categories"
      data-lenis-prevent
      // inert keeps every closed-panel link out of the tab order.
      inert={!open}
      onMouseEnter={onCancelLeave}
      onMouseLeave={(event: ReactMouseEvent) => {
        // Moving straight back onto the trigger is not a leave.
        const related = event.relatedTarget as Node | null;
        if (related instanceof HTMLElement && related.closest('[data-mega-trigger="true"]')) {
          return;
        }
        onLeave();
      }}
      onFocus={onCancelLeave}
      onBlur={onPanelFocusOut}
      onKeyDown={onPanelKeyDown}
      className={cn(
        "absolute inset-x-0 top-full max-h-[calc(100svh-var(--header-h))] overflow-y-auto border-b rule bg-bone text-ink",
        "transition-[transform,opacity,visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
      )}
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 py-10 md:px-10">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={`/products/${category.slug}`} onClick={onClose} className="group block">
                <span className="relative block aspect-[4/5] overflow-hidden bg-stone">
                  {category.image && (
                    <Image
                      src={category.image.url}
                      alt={category.image.alt}
                      fill
                      sizes="(min-width: 80rem) 15vw, (min-width: 64rem) 20vw, (min-width: 48rem) 25vw, 40vw"
                      className="object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    />
                  )}
                </span>
                <span className="mt-3 block">
                  {/* Brass hairline draws under the title on hover — never a lift/shadow. */}
                  <span className="relative inline-block pb-1 text-[0.8125rem] font-medium uppercase tracking-[0.12em] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-brass after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:after:scale-x-100">
                    {category.name}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-3 border-t rule pt-6">
          {megaQuickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="text-label text-ink/70 transition-colors duration-300 hover:text-brass"
            >
              {link.label}
              <span aria-hidden className="ml-1 text-brass">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
