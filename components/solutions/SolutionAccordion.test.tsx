import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SolutionAccordion } from "./SolutionAccordion";

describe("SolutionAccordion", () => {
  const items = [
    { id: "a", question: "Are PVC panels waterproof?", answer: "Yes, fully waterproof." },
    { id: "b", question: "Do you install?", answer: "We fabricate and install." },
  ];

  it("renders disclosure buttons with collapsed panels in SSR HTML", () => {
    const html = renderToString(<SolutionAccordion items={items} />);

    expect(html).toContain("Are PVC panels waterproof?");
    expect(html).toContain("Do you install?");

    // Buttons start collapsed (aria-expanded=false) and reference their panels.
    const buttonMatches = html.match(/aria-expanded="false"/g) ?? [];
    expect(buttonMatches.length).toBe(2);
    expect(html).toContain('aria-controls="');
    expect(html).toContain('aria-labelledby="');
    expect(html).not.toContain('aria-expanded="true"');
  });

  it("keeps answers in the DOM inside labelled panels", () => {
    const html = renderToString(<SolutionAccordion items={items} />);
    expect(html).toContain("Yes, fully waterproof.");
    expect(html).toContain("We fabricate and install.");
  });
});
