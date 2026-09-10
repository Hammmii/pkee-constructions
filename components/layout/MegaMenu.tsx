"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion/use-prefers-reduced-motion";
import { megaQuickLinks } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { MegaCategory } from "./types";

const EASE_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1]; // --ease-out-quart

type MegaMenuProps = {
  open: boolean;
  categories: MegaCategory[];
  /** Hover-intent callbacks owned by the header (trigger + panel share timers). */
  onLeave: () => void;
  onCancelLeave: () => void;
  /** Immediate close (Esc / link click) — the header returns focus to the trigger. */
  onClose: () => void;
};

// Tile entrance: staggered fade/rise per motion spec §4.5 (40–60ms steps).
// Reduced motion swaps in the instant variants so tiles render in final state.
const tileStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const tileRise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
const tileInstant = { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } };

/**
 * Products mega-menu: a featured family panel (Aesop pattern — crossfades
 * to the hovered/focused category) beside an image-tile grid per product
 * family, with a quick-links footer row.
 *
 * The header owns open state and hover intent; this component renders the
 * panel and its keyboard model: Esc closes (focus back to the trigger via
 * `onClose`), Arrow keys rove across links, Home/End jump, Tab is trapped
 * while open. Keyboard focus mirrors pointer hover for the featured image —
 * roving to a tile crossfades the panel just like hovering it. Tiles enter
 * with a staggered fade/rise when the menu opens. Everything animates
 * transform | opacity | visibility — the last keeps closed-panel links out
 * of the tab order — and the always-mounted panel keeps SSR output and
 * focus behavior stable. Reduced-motion CSS flushes the transition
 * instantly.
 */
export function MegaMenu({ open, categories, onLeave, onCancelLeave, onClose }: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [activeSlug, setActiveSlug] = useState<string | null>(categories[0]?.slug ?? null);
  const active = categories.find((category) => category.slug === activeSlug) ?? categories[0];

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

  const activate = (slug: string) => setActiveSlug(slug);
  const listVariants = reduced ? tileInstant : tileStagger;
  const itemVariants = reduced ? tileInstant : tileRise;

  return (
    <nav
      id="mega-menu"
      ref={panelRef}
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
        <div className="flex gap-10">
          {/* Featured family panel — crossfades to the hovered/focused tile. */}
          {active && (
            <aside className="hidden w-72 shrink-0 lg:block xl:w-80" aria-hidden="true">
              <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                <AnimatePresence initial={false} mode="popLayout">
                  {active.image && (
                    <motion.div
                      key={active.slug}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_QUART }}
                    >
                      <Image
                        src={active.image.url}
                        alt={active.image.alt}
                        fill
                        sizes="(min-width: 80rem) 20rem, 18rem"
                        className="object-cover"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-3 text-label text-ink/45">Featured family</p>
              <p className="mt-1 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-ink">
                {active.name}
              </p>
            </aside>
          )}

          <motion.ul
            initial={false}
            animate={open ? "show" : "hidden"}
            variants={listVariants}
            className="grid flex-1 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
          >
            {categories.map((category) => (
              <motion.li key={category.slug} variants={itemVariants}>
                <Link
                  href={`/products/${category.slug}`}
                  onClick={onClose}
                  onMouseEnter={() => activate(category.slug)}
                  onFocus={() => activate(category.slug)}
                  className="group block"
                >
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
              </motion.li>
            ))}
          </motion.ul>
        </div>

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
    </nav>
  );
}
