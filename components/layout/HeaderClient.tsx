"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { navLinks, quoteCta, transparentHeaderRoutes } from "@/lib/site";
import { cn } from "@/lib/utils";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import type { MegaCategory } from "./types";

const SCROLL_SOLID_THRESHOLD = 40;
const SCROLL_HIDE_MIN = 320;
const SCROLL_HIDE_DELTA = 4;
const MEGA_OPEN_DELAY_MS = 90;
const MEGA_CLOSE_DELAY_MS = 200;

type HeaderClientProps = {
  categories: MegaCategory[];
};

/**
 * Fixed site header. Transparent with bone text over full-hero routes until
 * ~40px of scroll, then solid bone with ≤12px blur; hides on scroll-down and
 * returns on scroll-up (transform only). Products opens the mega-menu;
 * mobile gets the hamburger → full-screen overlay.
 *
 * SSR contract: the header renders visible in the HTML; all state changes
 * happen post-hydration via scroll/pointer/focus events.
 */
export function HeaderClient({ categories }: HeaderClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const lastY = useRef(0);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaOpenRef = useRef(megaOpen);
  const menuOpenRef = useRef(menuOpen);
  const productsTriggerRef = useRef<HTMLButtonElement>(null);
  megaOpenRef.current = megaOpen;
  menuOpenRef.current = menuOpen;

  const overlaysOpen = megaOpen || menuOpen;
  const transparentRoute = transparentHeaderRoutes.includes(pathname);
  // Solid chrome whenever content has scrolled under it or an overlay is up.
  const solid = scrolled || !transparentRoute || overlaysOpen;

  // Scroll-aware chrome: solid past the threshold, hide on scroll-down.
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_SOLID_THRESHOLD);
      if (y > SCROLL_HIDE_MIN && y - lastY.current > SCROLL_HIDE_DELTA) {
        if (!megaOpenRef.current && !menuOpenRef.current) setHidden(true);
      } else if (lastY.current - y > SCROLL_HIDE_DELTA || y <= SCROLL_HIDE_MIN) {
        setHidden(false);
      }
      lastY.current = y;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation settles all overlays.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the intended trigger; the effect body only resets state
  useEffect(() => {
    setMegaOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Shared hover-intent timers for the trigger + mega-menu panel.
  const megaCancel = useCallback(() => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = null;
  }, []);

  const megaScheduleOpen = useCallback(() => {
    megaCancel();
    megaTimer.current = setTimeout(() => setMegaOpen(true), MEGA_OPEN_DELAY_MS);
  }, [megaCancel]);

  const megaScheduleClose = useCallback(() => {
    megaCancel();
    megaTimer.current = setTimeout(() => setMegaOpen(false), MEGA_CLOSE_DELAY_MS);
  }, [megaCancel]);

  useEffect(
    () => () => {
      if (megaTimer.current) clearTimeout(megaTimer.current);
    },
    [],
  );

  const closeMega = useCallback(() => {
    megaCancel();
    setMegaOpen(false);
    productsTriggerRef.current?.focus();
  }, [megaCancel]);

  const onTriggerMouseEnter = () => megaScheduleOpen();

  const onTriggerMouseLeave = (event: ReactMouseEvent<HTMLLIElement>) => {
    // Moving from the trigger straight into the panel is not a leave.
    const related = event.relatedTarget as Node | null;
    if (related instanceof HTMLElement && related.closest('[id="mega-menu"]')) return;
    megaScheduleClose();
  };

  const onTriggerFocus = () => {
    megaCancel();
    setMegaOpen(true);
  };

  const onProductsKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMegaOpen(true);
      // Move focus into the panel once it is interactive.
      requestAnimationFrame(() => {
        document.getElementById("mega-menu")?.querySelector<HTMLElement>("a[href]")?.focus();
      });
    } else if (event.key === "Escape") {
      setMegaOpen(false);
    }
  };

  const onNavBlur = (event: ReactFocusEvent<HTMLUListElement>) => {
    // React's onBlur bubbles (focusout semantics): when focus leaves the nav
    // entirely, close the mega-menu unless focus landed inside its panel.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setTimeout(() => {
        const panel = document.getElementById("mega-menu");
        if (panel && !panel.matches(":focus-within")) setMegaOpen(false);
      }, 0);
    }
  };

  return (
    <>
      {/* Pinned through view transitions — see `pkee-header` in globals.css. */}
      <header
        style={{ viewTransitionName: "pkee-header" }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          hidden && !overlaysOpen ? "-translate-y-full" : "translate-y-0",
          solid
            ? "border-b rule bg-bone/90 text-ink backdrop-blur-md"
            : "border-b border-transparent bg-transparent text-bone",
        )}
      >
        <div className="mx-auto flex h-[var(--header-h)] w-full max-w-[90rem] items-center justify-between px-6 md:px-10">
          {/* Wordmark — text only, brass full stop. */}
          <Link
            href="/"
            aria-label="PKEE Constructions — home"
            className="text-xl font-semibold tracking-[0.14em] md:text-2xl"
          >
            PKEE<span className="text-brass">.</span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            <ul className="flex items-center gap-8" onBlur={onNavBlur}>
              {navLinks.map((link) =>
                link.href === "/products" ? (
                  <li
                    key={link.href}
                    data-mega-trigger="true"
                    className="relative"
                    onMouseEnter={onTriggerMouseEnter}
                    onMouseLeave={onTriggerMouseLeave}
                  >
                    <button
                      ref={productsTriggerRef}
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={megaOpen}
                      aria-controls="mega-menu"
                      onClick={() => setMegaOpen((v) => !v)}
                      onFocus={onTriggerFocus}
                      onKeyDown={onProductsKeyDown}
                      className="flex items-center gap-1.5 py-2 text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors duration-300 hover:text-brass"
                    >
                      {link.label}
                      <svg
                        aria-hidden
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        className={cn(
                          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          megaOpen && "rotate-180",
                        )}
                      >
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="py-2 text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors duration-300 hover:text-brass"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
            <Button href={quoteCta.href} className="h-12 px-6">
              {quoteCta.label}
            </Button>
          </nav>

          {/* Mobile: quote shortcut + hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <Button href={quoteCta.href} className="h-11 px-5">
              {quoteCta.label}
            </Button>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              className="relative flex h-11 w-11 items-center justify-center"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute h-px w-6 bg-current transition-[transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  menuOpen ? "rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute h-px w-6 bg-current transition-[transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  menuOpen ? "-rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </div>

        {/* Mega-menu panel — desktop only, pinned under the fixed header. */}
        <div className="relative hidden lg:block">
          <MegaMenu
            open={megaOpen}
            categories={categories}
            onLeave={megaScheduleClose}
            onCancelLeave={megaCancel}
            onClose={closeMega}
          />
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
