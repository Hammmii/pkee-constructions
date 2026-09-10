import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import { site } from "@/lib/site";
import { FooterView } from "../FooterView";

describe("FooterView", () => {
  const categories = [
    { name: "PVC Wall Panels", slug: "pvc-wall-panels" },
    { name: "Charcoal Sheets", slug: "charcoal-sheets" },
  ];

  it("renders the showroom address", () => {
    const html = renderToString(<FooterView categories={categories} year={2026} />);
    expect(html).toContain(site.address.street);
    expect(html).toContain(site.address.city);
    expect(html).toContain(site.address.province);
  });

  it("renders the copyright bar with the year and brand", () => {
    const html = renderToString(<FooterView categories={categories} year={2026} />);
    expect(html).toContain("2026");
    expect(html).toContain(site.legalName);
  });

  it("links top CMS categories to their product routes", () => {
    const html = renderToString(<FooterView categories={categories} year={2026} />);
    expect(html).toContain('href="/products/pvc-wall-panels"');
    expect(html).toContain('href="/products/charcoal-sheets"');
  });

  it("renders the big-type heading with the serif-italic accent", () => {
    const html = renderToString(<FooterView categories={categories} year={2026} />);
    expect(html).toContain("font-accent");
    expect(html).toContain(">your</em>");
  });
});

describe("NotFound", () => {
  it("renders the brass 404 numeral and recovery links", () => {
    const html = renderToString(<NotFound />);
    expect(html).toContain("404");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/products"');
    expect(html).toContain("font-accent");
  });
});
