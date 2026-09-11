import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Media,
  Page,
  Product,
  ProductCategory,
  Project,
  Solution,
  Testimonial,
} from "@/payload-types";

const { mockFind } = vi.hoisted(() => ({ mockFind: vi.fn() }));

vi.mock("@/lib/payload", () => ({
  getPayloadCached: vi.fn(async () => ({ find: mockFind })),
}));

import Home from "./page";

async function render(element: ReactNode): Promise<string> {
  const stream = await renderToReadableStream(element);
  await stream.allReady;
  return new Response(stream as unknown as ReadableStream<Uint8Array>).text();
}

function media(id: number, url: string, alt: string): Media {
  return { id, alt, url, updatedAt: "", createdAt: "" };
}

const category: ProductCategory = {
  id: 1,
  name: "PVC Wall Panels",
  slug: "pvc-wall-panels",
  group: "sheets-panels",
  heroImage: media(11, "/media/cat.webp", "PVC wall panels"),
  updatedAt: "",
  createdAt: "",
};

const featuredProduct: Product = {
  id: 2,
  name: "Classic Marble PVC Panel",
  slug: "classic-marble-pvc-panel",
  category,
  summary: "Waterproof interlocking PVC panel with a realistic Carrara marble face.",
  heroImage: media(12, "/media/prod.webp", "Classic marble PVC panel"),
  featured: true,
  updatedAt: "",
  createdAt: "",
};

const livingRoom: Solution = {
  id: 3,
  name: "Living Room",
  slug: "living-room",
  heroImage: media(13, "/media/sol.webp", "Living room"),
  updatedAt: "",
  createdAt: "",
};

const featuredProject: Project = {
  id: 4,
  title: "River Heights Marble Bath",
  slug: "river-heights-marble-bath",
  location: "Winnipeg, MB",
  type: "residential",
  heroImage: media(14, "/media/proj.webp", "River Heights Marble Bath"),
  beforeImage: media(15, "/media/before.webp", "Before"),
  afterImage: media(16, "/media/after.webp", "After"),
  gallery: [media(17, "/media/detail.webp", "Detail")],
  featured: true,
  updatedAt: "",
  createdAt: "",
};

const featuredTestimonial: Testimonial = {
  id: 5,
  name: "Amara K.",
  rating: 5,
  text: "Our bathroom went from tired tile to a marble-panelled retreat in three days.",
  location: "Winnipeg, MB",
  verified: true,
  featured: true,
  updatedAt: "",
  createdAt: "",
};

const homePage: Page = {
  id: 6,
  title: "Home",
  slug: "home",
  blocks: [
    {
      blockType: "hero",
      heading: "Home hero",
      subheading: "Premium surfaces, engineered for Winnipeg homes & businesses.",
      image: media(18, "/media/hero.webp", "PKEE showroom"),
    },
    {
      blockType: "statsBand",
      stats: [
        { label: "Sq ft installed", value: "250,000+" },
        { label: "Product lines", value: "19" },
      ],
    },
  ],
  seo: { metaTitle: "PKEE Constructions | Premium Decorative Building Materials Winnipeg" },
  updatedAt: "",
  createdAt: "",
};

function seedFind(data: Record<string, unknown[]>) {
  mockFind.mockImplementation(async ({ collection }: { collection: string }) => ({
    docs: data[collection] ?? [],
  }));
}

describe("Home page (M4)", () => {
  beforeEach(() => {
    mockFind.mockReset();
    seedFind({
      "product-categories": [category],
      products: [featuredProduct],
      solutions: [livingRoom],
      projects: [featuredProject],
      testimonials: [featuredTestimonial],
      pages: [homePage],
    });
  });

  it("renders the hero headline, subtext, and both CTAs", async () => {
    const html = await render(<Home />);
    expect(html).toContain("Materials that turn");
    expect(html).toContain("statements");
    expect(html).toContain("Premium surfaces, engineered for Winnipeg homes");
    expect(html).toContain('href="/products"');
    expect(html).toContain('href="/quote"');
    // LCP hero image comes from the Pages home hero block (next/image encodes the src)
    expect(html).toContain("hero.webp");
    expect(html).toContain('fetchPriority="high"');
  });

  it("renders ticker, collections, spaces, and featured materials from the CMS", async () => {
    const html = await render(<Home />);
    // ticker: family name + showroom address
    expect(html).toContain("PVC Wall Panels");
    expect(html).toContain("Winnipeg — 360 Keewatin St");
    // collections explorer card
    expect(html).toContain('href="/products/pvc-wall-panels"');
    // shop by space tile
    expect(html).toContain('href="/solutions/living-room"');
    // featured material with fully-resolved product route
    expect(html).toContain("Classic Marble PVC Panel");
    expect(html).toContain('href="/products/pvc-wall-panels/classic-marble-pvc-panel"');
  });

  it("renders projects list, before/after slider, testimonials, trade, and final CTA", async () => {
    const html = await render(<Home />);
    expect(html).toContain("River Heights Marble Bath");
    expect(html).toContain('href="/projects/river-heights-marble-bath"');
    // before/after slider is keyboard-operable
    expect(html).toContain('role="slider"');
    expect(html).toContain("before.webp");
    expect(html).toContain("after.webp");
    // testimonials
    expect(html).toContain("Amara K.");
    expect(html).toContain("Verified project");
    // trade band + final CTA
    expect(html).toContain('href="/trade"');
    expect(html).toContain("in mind?");
    // LocalBusiness JSON-LD with the real address
    expect(html).toContain('"streetAddress":"360 Keewatin St"');
  });

  it("renders CMS stats from the Pages statsBand block", async () => {
    const html = await render(<Home />);
    expect(html).toContain("Sq ft installed");
    expect(html).toContain("250,000+");
  });

  it("degrades gracefully when the CMS is unreachable", async () => {
    mockFind.mockRejectedValue(new Error("database unavailable"));
    const html = await render(<Home />);
    // static sections still render
    expect(html).toContain("Materials that turn");
    expect(html).toContain("Upload your room.");
    expect(html).toContain("Have a");
    expect(html).toContain('href="/quote"');
    // no data-dependent sections, no crash
    expect(html).not.toContain("River Heights Marble Bath");
    expect(html).not.toContain('href="/solutions/living-room"');
  });
});
