import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "../Button";
import { SpecRow } from "../SpecRow";

describe("Button", () => {
  it("renders the solid variant classes", () => {
    const html = renderToString(<Button variant="solid">Request a Quote</Button>);
    expect(html).toContain("bg-ink");
    expect(html).toContain("text-bone");
    expect(html).toContain("Request a Quote");
  });

  it("renders the ghost variant classes and 2px radius", () => {
    const html = renderToString(<Button variant="ghost">Browse Materials</Button>);
    expect(html).toContain("border-stone");
    expect(html).toContain("rounded-[2px]");
  });

  it("renders a link when href is provided", () => {
    const html = renderToString(<Button href="/design-system">As Link</Button>);
    expect(html).toContain('href="/design-system"');
  });
});

describe("SpecRow", () => {
  it("renders the label and value", () => {
    const html = renderToString(<SpecRow label="Dimensions" value="2440 × 1220 × 8 mm" />);
    expect(html).toContain("Dimensions");
    expect(html).toContain("2440 × 1220 × 8 mm");
  });
});
