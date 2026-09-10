/**
 * Central analytics helper for PKEE Constructions.
 *
 * Plannable event names only — no vendor SDK calls. In the browser, events are
 * pushed to a global in-page queue (`window.pkeeAnalytics`) that the
 * orchestrator's centrally-wired loader can flush to a real destination
 * later.
 *
 * Env-gated: `track` is a no-op unless `NEXT_PUBLIC_ANALYTICS_ID` is set.
 * In development (with the env set) each tracked event is echoed via
 * `console.debug`.
 */

export const ANALYTICS_EVENTS = [
  "product_view",
  "search",
  "filter_use",
  "quote_start",
  "quote_complete",
  "sample_request",
  "consultation_booking",
  "dealer_application",
  "phone_click",
  "email_click",
  "whatsapp_click",
  "get_this_look_click",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export type TrackedEvent = {
  event: AnalyticsEvent;
  properties: AnalyticsProperties;
  timestamp: string;
};

export type AnalyticsQueue = TrackedEvent[];

declare global {
  interface Window {
    pkeeAnalytics?: AnalyticsQueue;
  }
}

export type Tracker = {
  track: (event: AnalyticsEvent, properties?: AnalyticsProperties) => TrackedEvent | undefined;
  readonly enabled: boolean;
};

export type TrackerOptions = {
  /** Analytics destination ID. When falsy the tracker is inert. */
  id: string | undefined;
  /** Echo tracked events to console.debug (defaults to NODE_ENV !== "production"). */
  debug?: boolean;
  /** Sink override for tests / non-DOM hosts. Defaults to the window queue. */
  sink?: (queue: AnalyticsQueue, event: TrackedEvent) => void;
  /** Clock override for tests. */
  now?: () => Date;
};

const defaultSink = (queue: AnalyticsQueue, event: TrackedEvent) => {
  queue.push(event);
};

export function createTracker(options: TrackerOptions): Tracker {
  const { id, sink = defaultSink, now = () => new Date() } = options;
  const debug = options.debug ?? process.env.NODE_ENV !== "production";
  const enabled = Boolean(id);
  const fallbackQueue: AnalyticsQueue = [];

  const track = (event: AnalyticsEvent, properties: AnalyticsProperties = {}) => {
    if (!enabled) return undefined;
    const tracked: TrackedEvent = { event, properties, timestamp: now().toISOString() };
    if (typeof window !== "undefined") {
      window.pkeeAnalytics = window.pkeeAnalytics ?? [];
      sink(window.pkeeAnalytics, tracked);
    } else {
      sink(fallbackQueue, tracked);
    }
    if (debug) {
    }
    return tracked;
  };

  return { enabled, track };
}

let defaultTracker: Tracker | undefined;

const getDefaultTracker = (): Tracker => {
  if (!defaultTracker) {
    defaultTracker = createTracker({ id: process.env.NEXT_PUBLIC_ANALYTICS_ID });
  }
  return defaultTracker;
};

/** Env-gated tracker used by site components. No-op without NEXT_PUBLIC_ANALYTICS_ID. */
export const track = (event: AnalyticsEvent, properties: AnalyticsProperties = {}) =>
  getDefaultTracker().track(event, properties);

export const isAnalyticsEnabled = () => getDefaultTracker().enabled;
