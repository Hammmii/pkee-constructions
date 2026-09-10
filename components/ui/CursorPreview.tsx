"use client";

import { AnimatePresence, MotionValue, motion } from "motion/react";
import Image from "next/image";
import { type PointerEvent, type ReactNode, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";

const EASE_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1]; // --ease-out-quart

/**
 * Archive-index cursor preview (Material Bank pattern): one floating image
 * follows the cursor across a card list and crossfades to whichever card is
 * hovered. Shared by the /products and /projects grids via ProductCard and
 * ProjectCard.
 *
 * Position flows through module-level motion values (spring-smoothed in the
 * single floating layer, zero React re-renders); only hover state
 * (src/alt/visible) reaches React state. Pointer handlers live on each card
 * and only fire while that card is hovered — there is no global mousemove
 * listener. Desktop + fine pointer + no reduced motion, and only on the two
 * list routes (detail pages reuse the same cards and keep image-in-place
 * hover). All motion is transform | opacity.
 */

let content: { src: string | null; alt: string; visible: boolean } = {
  src: null,
  alt: "",
  visible: false,
};
const contentSubs = new Set<(next: typeof content) => void>();

const sharedX = new MotionValue(0);
const sharedY = new MotionValue(0);

function publishContent(patch: Partial<typeof content>) {
  content = { ...content, ...patch };
  for (const notify of contentSubs) notify(content);
}

// Only one floating layer renders per page regardless of card count.
let layerCount = 0;
function claimLayer() {
  layerCount += 1;
  return layerCount === 1;
}
function releaseLayer() {
  layerCount = Math.max(0, layerCount - 1);
}

const PREVIEW_ROUTES = new Set(["/products", "/projects"]);

type CursorPreviewProps = {
  src: string | null | undefined;
  alt: string;
  children: ReactNode;
  className?: string;
};

export function CursorPreview({ src, alt, children, className }: CursorPreviewProps) {
  const reduced = usePrefersReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFinePointer(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setFinePointer(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const active = finePointer && !reduced && Boolean(src);

  // Route gate lives in the handlers (window.location) so this island never
  // needs the router context — it stays renderable anywhere, including tests.
  const onListRoute = () => PREVIEW_ROUTES.has(window.location.pathname);

  const show = (event: PointerEvent<HTMLDivElement>) => {
    if (!active || !onListRoute()) return;
    // Publish position on enter too — a hover without a subsequent move
    // (stationary cursor, move swallowed by an overlay) must not strand
    // the preview at its previous spot.
    sharedX.set(event.clientX);
    sharedY.set(event.clientY);
    publishContent({ src: src ?? null, alt, visible: true });
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    sharedX.set(event.clientX);
    sharedY.set(event.clientY);
  };
  const hide = () => {
    if (active) publishContent({ visible: false });
  };

  return (
    <div className={className} onPointerEnter={show} onPointerMove={move} onPointerLeave={hide}>
      {children}
      <PreviewLayer />
    </div>
  );
}

function PreviewLayer() {
  const [isLayer, setIsLayer] = useState(false);
  const [snap, setSnap] = useState(content);

  useEffect(() => {
    if (!claimLayer()) return undefined;
    setIsLayer(true);
    return () => {
      releaseLayer();
      publishContent({ visible: false });
    };
  }, []);

  useEffect(() => {
    const notify = (next: typeof content) => setSnap(next);
    contentSubs.add(notify);
    return () => {
      contentSubs.delete(notify);
    };
  }, []);

  // Single-child split: LayerSurface mounts exactly once per page, so exactly
  // one spring per axis ever subscribes to the shared values. (Every card's
  // PreviewLayer runs hooks; mounting the springs here — not in PreviewLayer —
  // keeps them single-instance and unconditional.)
  if (!isLayer) return null;
  return <LayerSurface snap={snap} />;
}

function LayerSurface({ snap }: { snap: typeof content }) {
  const reduced = usePrefersReducedMotion();
  // Bind the shared values DIRECTLY: the pointer handlers write them and
  // motion mirrors MotionValues into style without any React render. A
  // spring-smoothed variant was tried repeatedly (useSpring source-following,
  // per-event .set, single/multiple instances) and motion v13 consistently
  // dropped the first updates after mount — direct binding is the reliable
  // path. Fade/scale entrance and the src crossfade stay animated.

  return (
    <AnimatePresence>
      {snap.visible && !reduced && snap.src && (
        <motion.div
          key="cursor-preview"
          aria-hidden="true"
          data-cursor-preview
          className="pointer-events-none fixed left-0 top-0 z-30"
          style={{ x: sharedX, y: sharedY }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, ease: EASE_QUART }}
        >
          {/* Centering offset lives on a nested element — motion's `x` is an
              alias for translateX, so a translateX here would clobber it. */}
          <div className="aspect-[4/5] w-64 -translate-x-1/2 -translate-y-[calc(100%_+_20px)] overflow-hidden bg-stone">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={snap.src}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_QUART }}
              >
                <Image src={snap.src} alt={snap.alt} fill sizes="256px" className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
