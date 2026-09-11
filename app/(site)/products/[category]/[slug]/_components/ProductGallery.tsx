"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { type LightboxImage, ProductLightbox } from "@/components/catalog/ProductLightbox";
import { cn } from "@/lib/utils";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Product gallery: main stage + thumbnail strip + lightbox. The stage and
 * the lightbox share layoutIds so the clicked image morphs open (shared-
 * element transition); Esc / arrow keys / buttons all operate the lightbox.
 */
export function ProductGallery({
  images,
  layoutIdPrefix,
  priority = false,
}: {
  images: LightboxImage[];
  layoutIdPrefix: string;
  priority?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const current = images[active];

  if (!current) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxIndex(active)}
        aria-label={`Open image viewer: ${current.alt}`}
        className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-stone/40"
      >
        <motion.div
          key={current.src}
          layoutId={`${layoutIdPrefix}-${active}`}
          className="absolute inset-0"
          transition={{ duration: 0.6, ease: EXPO }}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </motion.div>
        <span
          aria-hidden
          className="absolute bottom-4 right-4 border border-[color:var(--line-on-dark)] bg-ink/55 px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-bone opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100"
        >
          View full size
        </span>
      </button>

      {images.length > 1 && (
        <ul className="mt-4 flex gap-3" aria-label="Product images">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}: ${image.alt}`}
                aria-current={i === active}
                className={cn(
                  "relative block h-20 w-16 overflow-hidden border transition-colors duration-300",
                  i === active
                    ? "border-brass ring-1 ring-brass"
                    : "border-stone hover:border-ink/40",
                )}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ProductLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(next) => {
          setLightboxIndex(next);
          setActive(next);
        }}
        layoutIdPrefix={layoutIdPrefix}
      />
    </div>
  );
}
