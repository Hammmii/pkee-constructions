import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PageTransition } from "../PageTransition";
import { TypeFillSection } from "../TypeFillSection";
import { supportsViewTransitions } from "../view-transition";

vi.mock("next/navigation", () => ({
  usePathname: () => "/products/pvc-wall-panels/example",
}));

describe("PageTransition (R2.1)", () => {
  it("always renders route children (SSR, no VT in node)", () => {
    const html = renderToString(
      <PageTransition>
        <p>route content</p>
      </PageTransition>,
    );
    expect(html).toContain("route content");
  });

  it("falls back to the ink-wipe outside View-Transition-capable runtimes", () => {
    // Node has no document — the VT branch is skipped and the AnimatePresence
    // ink-wipe fallback renders instead (no crash, content present).
    expect(supportsViewTransitions()).toBe(false);
    const html = renderToString(
      <PageTransition>
        <p>fallback content</p>
      </PageTransition>,
    );
    expect(html).toContain("fallback content");
  });
});

describe("TypeFillSection (R2.3)", () => {
  it("renders the statement fully visible in SSR HTML", () => {
    const html = renderToString(<TypeFillSection image={{ url: "/tex.jpg", alt: "Texture" }} />);
    // Both the texture pass and the solid-fill pass carry the full line —
    // the fill wrapper starts at clip-path inset(-2% 0% -2% 0) = fully shown.
    expect(html).toContain("Materials that");
    expect(html).toContain("trends.");
    expect(html).toContain("bg-clip-text");
    expect(html).toContain("inset(-2% 0% -2% 0)");
  });

  it("falls back to a gradient texture when no CMS image is supplied", () => {
    const html = renderToString(<TypeFillSection image={null} />);
    expect(html).toContain("linear-gradient");
  });
});
