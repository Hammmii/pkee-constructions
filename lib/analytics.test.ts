import { describe, expect, it } from "vitest";
import type { AnalyticsQueue, TrackedEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS, createTracker } from "@/lib/analytics";

const collectSink = (_queue: AnalyticsQueue) => (events: TrackedEvent[], event: TrackedEvent) => {
  events.push(event);
};

describe("createTracker", () => {
  it("is inert when no analytics id is set", () => {
    const tracker = createTracker({ id: undefined });
    expect(tracker.enabled).toBe(false);
    expect(tracker.track("product_view", { slug: "pvc-panels" })).toBeUndefined();
  });

  it("tracks events with timestamp and properties when enabled", () => {
    const events: TrackedEvent[] = [];
    const tracker = createTracker({
      id: "test-id",
      debug: false,
      now: () => new Date("2026-09-11T12:00:00.000Z"),
      sink: (queue, event) => collectSink(queue)(events, event),
    });

    const tracked = tracker.track("quote_complete", { reference: "PK-2026-0001" });

    expect(tracked).toEqual({
      event: "quote_complete",
      properties: { reference: "PK-2026-0001" },
      timestamp: "2026-09-11T12:00:00.000Z",
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("quote_complete");
  });

  it("defaults properties to an empty object", () => {
    const events: TrackedEvent[] = [];
    const tracker = createTracker({
      id: "test-id",
      debug: false,
      sink: (queue, event) => collectSink(queue)(events, event),
    });

    tracker.track("search");

    expect(events[0]?.properties).toEqual({});
  });

  it("falls back to an internal queue outside the DOM", () => {
    const tracker = createTracker({ id: "test-id", debug: false });
    expect(tracker.track("phone_click", { location: "contact" })?.event).toBe("phone_click");
    expect(globalThis.window).toBeUndefined();
  });

  it("covers every event name the orchestrator plans to wire", () => {
    expect([...ANALYTICS_EVENTS]).toEqual([
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
    ]);
  });
});
