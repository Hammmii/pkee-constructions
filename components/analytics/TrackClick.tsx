"use client";

import type { MouseEvent, ReactNode } from "react";
import type { AnalyticsEvent, AnalyticsProperties } from "@/lib/analytics";
import { track } from "@/lib/analytics";

type TrackClickProps = {
  event: AnalyticsEvent;
  /** Where the click happened, e.g. a page slug or section name. */
  source?: string;
  /** Fallback href when the click target is not an anchor. */
  href?: string;
  properties?: AnalyticsProperties;
  children: ReactNode;
};

/**
 * Click-tracking wrapper for CTAs and contact links in server pages. Renders
 * a layout-neutral wrapper (display:contents) so it can surround styled
 * links/buttons without affecting the visual tree; the href is captured from
 * the nearest anchor actually clicked.
 */
export function TrackClick({ event, source, href, properties, children }: TrackClickProps) {
  const onClick = (e: MouseEvent<HTMLSpanElement>) => {
    const anchor = (e.target as HTMLElement | null)?.closest?.("a");
    const resolvedHref = anchor?.getAttribute("href") ?? href ?? null;
    track(event, { href: resolvedHref, ...(source ? { source } : {}), ...properties });
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: tracking-only wrapper; the interactive element is the child anchor, whose click (mouse or keyboard) bubbles here.
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard activation on the child anchor emits click, which bubbles to this handler.
    <span className="contents" onClick={onClick}>
      {children}
    </span>
  );
}
