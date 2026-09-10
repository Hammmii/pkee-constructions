import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Media, ProductCategory } from "@/payload-types";
import { ProductCard } from "../ProductCard";

const category: ProductCategory = {
  id: 1,
  name: "PVC Wall Panels",
  slug: "pvc-wall-panels",
  group: "walls-backdrops",
  updatedAt: "",
  createdAt: "",
};

const heroImage: Media = {
  id: 2,
  alt: "Classic marble PVC panel installed on a feature wall",
  updatedAt: "",
  createdAt: "",
  url: "/api/media/file/classic-marble.png",
  width: 1200,
  height: 1500,
  sizes: {
    card: { url: "/api/media/file/classic-marble-768.png" },
  },
};

const product = {
  id: 3,
  name: "Classic Marble PVC Panel",
  slug: "classic-marble-pvc-panel",
  summary: "A marble-look panel.",
  category,
  heroImage,
  updatedAt: "",
  createdAt: "",
};

describe("ProductCard", () => {
  it("links to the product detail route", () => {
    const html = renderToString(<ProductCard product={product} />);
    expect(html).toContain('href="/products/pvc-wall-panels/classic-marble-pvc-panel"');
  });

  it("renders the product name", () => {
    const html = renderToString(<ProductCard product={product} />);
    expect(html).toContain("Classic Marble PVC Panel");
  });

  it("renders the category label", () => {
    const html = renderToString(<ProductCard product={product} />);
    expect(html).toContain("PVC Wall Panels");
  });

  it("prefers the card-size image src with meaningful alt text", () => {
    const html = renderToString(<ProductCard product={product} />);
    // next/image rewrites src through /_next/image — assert on the filename.
    expect(html).toContain("classic-marble-768.png");
    expect(html).toContain("Classic marble PVC panel installed on a feature wall");
  });

  it("falls back to the raw media url when no card size exists", () => {
    const { card: _card, ...restSizes } = heroImage.sizes ?? {};
    const bare = { ...product, heroImage: { ...heroImage, sizes: restSizes } };
    const html = renderToString(<ProductCard product={bare} />);
    expect(html).toContain("classic-marble.png");
    expect(html).not.toContain("classic-marble-768.png");
  });

  it("derives alt text from the name when media alt is missing", () => {
    const noAlt = { ...product, heroImage: { ...heroImage, alt: "" } };
    const html = renderToString(<ProductCard product={noAlt} />);
    expect(html).toContain("Classic Marble PVC Panel — PVC Wall Panels");
  });

  it("keeps a working href when the category relation is unpopulated", () => {
    const unpopulated = { ...product, category: 1 as number | ProductCategory };
    const html = renderToString(
      <ProductCard product={unpopulated} categorySlug="pvc-wall-panels" />,
    );
    expect(html).toContain('href="/products/pvc-wall-panels/classic-marble-pvc-panel"');
  });
});
