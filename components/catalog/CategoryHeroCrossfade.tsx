"use client";

import Image from "next/image";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePrefersReducedMotion } from "@/components/motion/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export type CrossfadeLayerImage = {
  id: string;
  src: string;
  alt: string;
};

type CrossfadeContextValue = {
  active: string | null;
  layers: CrossfadeLayerImage[];
  activate: (id: string | null) => void;
};

const CrossfadeContext = createContext<CrossfadeContextValue>({
  active: null,
  layers: [],
  activate: () => {},
});

type CategoryCrossfadeProviderProps = {
  layers: CrossfadeLayerImage[];
  children: ReactNode;
};

/**
 * Dekton-pattern hover crossfade for the category page: hovering a product
 * card fades that product's photography in over the category hero
 * background, via opacity layers only. The provider is a pass-through
 * wrapper (no DOM); layers render client-side after mount and only on
 * fine-pointer devices, so the SSR hero stays the LCP element and
 * nothing new enters the initial critical path.
 */
export function CategoryCrossfadeProvider({ layers, children }: CategoryCrossfadeProviderProps) {
  const [active, setActive] = useState<string | null>(null);
  const activate = useCallback((id: string | null) => setActive(id), []);
  const value = useMemo(() => ({ active, layers, activate }), [active, layers, activate]);
  return <CrossfadeContext.Provider value={value}>{children}</CrossfadeContext.Provider>;
}

/**
 * Stack of crossfade layers — render inside the category hero, absolutely
 * positioned over the SSR base image. Opacity-only transitions
 * (600ms --ease-out-quart); reduced-motion users get an instant swap.
 */
export function CategoryCrossfadeLayer({ className }: { className?: string }) {
  const { layers, active } = useContext(CrossfadeContext);
  const reduced = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setEnabled(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setEnabled(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!enabled || layers.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden="true">
      {layers.map((layer) => (
        <Image
          key={layer.id}
          src={layer.src}
          alt=""
          fill
          sizes="100vw"
          className={cn(
            "object-cover opacity-0 transition-opacity",
            reduced ? "duration-0" : "duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]",
            active === layer.id && "opacity-70",
          )}
        />
      ))}
    </div>
  );
}

/** Wrapper that activates a crossfade layer on hover or keyboard focus. */
export function CategoryCrossfadeTrigger({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { activate } = useContext(CrossfadeContext);
  return (
    // biome-ignore lint/a11y/useSemanticElements: pass-through hover/focus tracker wrapping a card link; not a form group.
    <div
      role="group"
      className={className}
      onMouseEnter={() => activate(id)}
      onMouseLeave={() => activate(null)}
      onFocus={() => activate(id)}
      onBlur={() => activate(null)}
    >
      {children}
    </div>
  );
}
