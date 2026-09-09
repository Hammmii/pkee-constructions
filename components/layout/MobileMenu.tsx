"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { navLinks, quoteCta, site } from "@/lib/site";
import { useMounted, usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Full-screen mobile menu: oversized staggered links with brass index
 * numerals, contact block pinned to the bottom, and the quote CTA. Focus is
 * trapped while open, Esc closes (returning focus to the hamburger), and
 * body scroll is locked via Lenis + overflow. Content renders visible in the
 * SSR HTML; the stagger engages only post-hydration and never under
 * reduced motion.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Lock body scroll (and Lenis) while open; remember the invoking element.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    lenis?.stop();

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      lenis?.start();
      restoreFocusRef.current?.focus();
    };
  }, [open, lenis]);

  const focusables = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  // Focus the first link once the overlay is up (skip on reduced motion is
  // unnecessary — focus management is motion-independent).
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => focusables()[0]?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const animate = mounted && !reduced;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          onKeyDown={onKeyDown}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={animate ? { opacity: 0 } : undefined}
          transition={{ duration: 0.35, ease: EXPO }}
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink text-bone lg:hidden"
        >
          {/* Clear the fixed header. */}
          <div className="h-[var(--header-h)]" aria-hidden />

          <nav aria-label="Mobile" className="flex-1 px-6 md:px-10">
            <ul className="flex flex-col">
              {navLinks.map((link, i) => (
                <li key={link.href} className="border-b rule-on-dark">
                  <motion.div
                    initial={animate ? { opacity: 0, y: 32 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EXPO, delay: 0.06 + i * 0.055 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="group flex items-baseline gap-5 py-5"
                    >
                      <span aria-hidden className="text-label text-brass">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[clamp(2rem,8vw,3.5rem)] font-medium uppercase leading-[1.05] tracking-[-0.02em] transition-colors duration-300 group-hover:text-brass">
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>

          <motion.div
            initial={animate ? { opacity: 0, y: 24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EXPO, delay: 0.06 + navLinks.length * 0.055 }}
            className="px-6 pb-10 pt-8 md:px-10"
          >
            <div className="mb-8">
              <p className="text-label text-brass">Showroom</p>
              <p className="mt-3 text-[color:var(--bone-on-ink)]">
                {site.address.street}
                <br />
                {site.address.city}, {site.address.province}
              </p>
              <p className="mt-3">
                <a
                  href={site.phone.href}
                  className="block text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                >
                  {site.phone.display}
                </a>
                <a
                  href={`mailto:${site.email}`}
                  className="block text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                >
                  {site.email}
                </a>
              </p>
            </div>
            <Button href={quoteCta.href} dark className="w-full">
              {quoteCta.label}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
