"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type BeforeAfterSliderProps = {
  /** "Before" layer — clipped, revealed left of the handle. */
  before: ReactNode;
  /** "After" layer — full-bleed underneath. */
  after: ReactNode;
  /** Accessible label, e.g. "Project 12 — raw wall vs finished feature wall". */
  label: string;
  defaultPosition?: number;
  className?: string;
};

const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

/**
 * Draggable clip-path comparison ("raw wall → finished feature wall").
 * Pointer events on the track plus arrow-key support on the handle.
 * Only user-driven — no automatic motion, so reduced-motion users get
 * the identical interaction.
 */
export function BeforeAfterSlider({
  before,
  after,
  label,
  defaultPosition = 50,
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const clamp = (value: number) => Math.max(0, Math.min(100, value));

  const positionFromPointer = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    positionFromPointer(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) positionFromPointer(event.clientX);
  };

  const endDrag = () => setDragging(false);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!KEYS.has(event.key)) return;
    event.preventDefault();
    setPosition((current) => {
      if (event.key === "Home") return 0;
      if (event.key === "End") return 100;
      const step = event.key === "ArrowLeft" ? -5 : 5;
      return clamp(current + step);
    });
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative aspect-[4/3] w-full touch-none overflow-hidden select-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* after layer */}
      <div className="absolute inset-0">{after}</div>
      {/* before layer, clipped to the left of the handle */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {before}
      </div>
      {/* handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="absolute top-0 bottom-0 z-10 w-px -translate-x-1/2 bg-bone outline-offset-4 focus-visible:outline-2"
        style={{ left: `${position}%`, boxShadow: "0 0 0 1px rgb(20 18 15 / 0.25)" }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2px] bg-bone text-ink shadow-md">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
            <path d="M5 1 1 5l4 4M11 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>
    </div>
  );
}
