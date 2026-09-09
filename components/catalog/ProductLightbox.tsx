"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type LightboxImage = {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Product gallery lightbox: layoutId shared-element morph from the gallery,
 * Esc closes, focus-trapped, arrow-key / button prev-next, scrollable areas
 * carry data-lenis-prevent so Lenis never hijacks modal wheel events.
 */
export function ProductLightbox({
  images,
  index,
  onClose,
  onNavigate,
  layoutIdPrefix,
  children,
}: {
  images: LightboxImage[];
  /** Active image index, or null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
  /** Unique per product so layoutIds never collide across pages. */
  layoutIdPrefix: string;
  /** Optional spec sidebar content rendered beside the stage. */
  children?: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null && images.length > 0;
  const active = open ? images[index as number] : null;

  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  // Esc / arrow keys + focus management
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Tab") {
        // Simple focus trap: keep Tab cycling inside the dialog.
        const root = document.getElementById("product-lightbox");
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, prev, next]);

  return (
    <AnimatePresence>
      {open && active && (
        <motion.div
          id="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-[90] flex flex-col bg-ink/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EXPO }}
        >
          <div className="flex items-center justify-between px-5 py-4 md:px-8">
            <p className="text-label text-[color:var(--bone-dim)]">
              {(index as number) + 1} / {images.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              className="flex h-11 w-11 items-center justify-center border border-[color:var(--line-on-dark)] text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:border-brass hover:text-brass"
            >
              ×
            </button>
          </div>

          <div
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6 md:flex-row md:px-8"
            data-lenis-prevent
          >
            <div className="relative flex min-h-[50svh] flex-1 items-center justify-center">
              <motion.div
                key={active.src}
                layoutId={`${layoutIdPrefix}-${index}`}
                className="relative max-h-[70svh] w-full max-w-4xl"
                transition={{ duration: 0.6, ease: EXPO }}
              >
                <Image
                  src={active.src}
                  alt={active.alt}
                  width={active.width ?? 1600}
                  height={active.height ?? 1200}
                  sizes="90vw"
                  className="h-auto max-h-[70svh] w-full object-contain"
                  priority
                />
              </motion.div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous image"
                    className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-[color:var(--line-on-dark)] text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:border-brass hover:text-brass"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next image"
                    className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-[color:var(--line-on-dark)] text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:border-brass hover:text-brass"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {children && (
              <aside className="w-full shrink-0 text-[color:var(--bone-on-ink)] md:w-80">
                {children}
              </aside>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
