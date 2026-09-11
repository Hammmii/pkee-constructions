"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Swatch = {
  name: string;
  /** Hex colour, when the CMS provides one. */
  hex?: string | null;
};

/**
 * Finish / colour swatch picker: dots with a brass active ring. Selection
 * is presentational (name shown beside the strip) — variants carry no SKU.
 */
export function FinishSwatches({
  title,
  swatches,
  idPrefix,
}: {
  title: string;
  swatches: Swatch[];
  idPrefix: string;
}) {
  const [selected, setSelected] = useState(0);
  const current = swatches[selected];
  if (!current) return null;

  return (
    <div>
      <p className="text-label text-ink/50">
        {title} — <span className="text-ink">{current.name}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label={title}>
        {swatches.map((swatch, i) => (
          // biome-ignore lint/a11y/useSemanticElements: styled radio-dot pattern needs no native input chrome
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: swatch names may repeat within one picker
            key={`${swatch.name}-${i}`}
            type="button"
            role="radio"
            aria-checked={i === selected}
            aria-label={swatch.name}
            id={`${idPrefix}-${i}`}
            onClick={() => setSelected(i)}
            className={cn(
              "h-8 w-8 rounded-full border transition-all duration-300",
              i === selected
                ? "border-brass ring-2 ring-brass ring-offset-2 ring-offset-bone"
                : "border-stone hover:border-ink/40",
            )}
            style={swatch.hex ? { backgroundColor: swatch.hex } : undefined}
          >
            {!swatch.hex && (
              <span className="flex h-full w-full items-center justify-center text-[0.5rem] uppercase tracking-wider text-ink/50">
                {swatch.name.slice(0, 2)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
