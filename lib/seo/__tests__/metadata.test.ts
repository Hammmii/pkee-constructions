import { describe, expect, it } from "vitest";
import { absoluteUrl, buildMetadata, getBaseUrl } from "../metadata";

describe("getBaseUrl", () => {
  it("falls back to the public origin when NEXT_PUBLIC_SITE_URL is unset", () => {
    expect(getBaseUrl()).toBe("https://www.pkeeconstructions.ca");
  });
});

describe("absoluteUrl", () => {
  it("keeps absolute URLs untouched", () => {
    expect(absoluteUrl("https://cdn.example.com/img.png")).toBe("https://cdn.example.com/img.png");
  });

  it("joins relative paths to the base URL", () => {
    expect(absoluteUrl("/products")).toBe("https://www.pkeeconstructions.ca/products");
    expect(absoluteUrl("products")).toBe("https://www.pkeeconstructions.ca/products");
  });
});

describe("buildMetadata", () => {
  it("builds absolute canonical, OG and twitter URLs from the path", () => {
    const meta = buildMetadata({
      title: "Material Library",
      description: "Browse materials.",
      path: "/products",
    });
    expect(meta.alternates?.canonical).toBe("https://www.pkeeconstructions.ca/products");
    expect(meta.openGraph?.url).toBe("https://www.pkeeconstructions.ca/products");
    expect(meta.openGraph?.siteName).toBe("PKEE Constructions");
    expect(meta.title).toBe("Material Library");
  });

  it("passes the title through the root template", () => {
    // Template application happens in the root layout at render time; the
    // factory just forwards the segment title.
    const meta = buildMetadata({ title: "PVC Panels", description: "d", path: "/x" });
    expect(meta.title).toBe("PVC Panels");
  });

  it("includes an OG image when provided and resolves it absolutely", () => {
    const meta = buildMetadata({
      title: "Panel",
      description: "d",
      path: "/products/x/y",
      image: "/api/media/file/hero.png",
    });
    expect(meta.openGraph?.images).toEqual([
      { url: "https://www.pkeeconstructions.ca/api/media/file/hero.png" },
    ]);
    expect(meta.twitter?.images).toEqual([
      "https://www.pkeeconstructions.ca/api/media/file/hero.png",
    ]);
  });

  it("omits the image keys when no image is given", () => {
    const meta = buildMetadata({ title: "Panel", description: "d", path: "/x" });
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.twitter?.images).toBeUndefined();
  });

  it("marks filtered pages noindex but follow", () => {
    const meta = buildMetadata({
      title: "Filtered",
      description: "d",
      path: "/products",
      index: false,
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("leaves robots unset for indexable pages", () => {
    const meta = buildMetadata({ title: "Ok", description: "d", path: "/products" });
    expect(meta.robots).toBeUndefined();
  });
});
