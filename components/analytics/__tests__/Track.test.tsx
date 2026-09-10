import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AnalyticsQueue } from "@/lib/analytics";
import { createTracker } from "@/lib/analytics";
import { Track } from "../Track";
import { TrackClick } from "../TrackClick";

describe("Track", () => {
  it("renders nothing", () => {
    const html = renderToString(
      <Track
        event="product_view"
        properties={{ product: "pvc-panels", category: "pvc-wall-panels" }}
      />,
    );
    expect(html).toBe("");
  });

  it("fires exactly one event with the given properties via the window queue", () => {
    const queue: AnalyticsQueue = [];
    const originalWindow = globalThis.window;
    // @ts-expect-error - minimal DOM shim for the window queue
    globalThis.window = { pkeeAnalytics: queue };
    try {
      const tracker = createTracker({ id: "test-id", debug: false });
      tracker.track("quote_start", { product: "faux-stone" });
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event: "quote_start",
        properties: { product: "faux-stone" },
      });
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

describe("TrackClick", () => {
  it("renders its children inside a layout-neutral wrapper", () => {
    const html = renderToString(
      <TrackClick event="phone_click" source="contact">
        <a href="tel:+12045550137">Call us</a>
      </TrackClick>,
    );
    expect(html).toContain('class="contents"');
    expect(html).toContain('href="tel:+12045550137"');
    expect(html).toContain("Call us");
  });

  it("keeps the href on the anchor for get-this-look CTAs", () => {
    const html = renderToString(
      <TrackClick event="get_this_look_click" source="maple-kitchen" href="/quote?product=x">
        <a href="/quote?product=x">Request a quote</a>
      </TrackClick>,
    );
    expect(html).toContain('href="/quote?product=x"');
  });

  it("sink receives events through the default tracker when enabled", () => {
    const events: string[] = [];
    const tracker = createTracker({
      id: "test-id",
      debug: false,
      sink: (_queue, event) => {
        events.push(event.event);
      },
    });
    expect(tracker.track("filter_use", { param: "room", value: "kitchen" })?.event).toBe(
      "filter_use",
    );
    expect(events).toEqual(["filter_use"]);
  });
});
