"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEvent, AnalyticsProperties } from "@/lib/analytics";
import { track } from "@/lib/analytics";

type TrackProps = {
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
};

/**
 * Fires a single analytics event on mount. Render inside server pages where
 * an event marks a view (product detail, form confirmation). The component
 * renders nothing and is a no-op unless NEXT_PUBLIC_ANALYTICS_ID is set.
 */
export function Track({ event, properties }: TrackProps) {
  // Properties may be rebuilt each render in server parents; keep only the
  // first snapshot so the event fires exactly once with stable props.
  const first = useRef<{ event: AnalyticsEvent; properties?: AnalyticsProperties } | null>(null);
  if (first.current === null) {
    first.current = { event, properties };
  }

  useEffect(() => {
    const { event: e, properties: p } = first.current ?? {};
    if (e) track(e, p);
  }, []);

  return null;
}
