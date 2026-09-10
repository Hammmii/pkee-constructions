import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Project } from "@/payload-types";
import { ProjectCard } from "./ProjectCard";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    title: "Keewatin Feature Wall",
    slug: "keewatin-feature-wall",
    location: "Winnipeg, MB",
    type: "residential",
    room: ["living-room"],
    heroImage: {
      id: 2,
      url: "/media/hero.webp",
      alt: "Finished feature wall",
      updatedAt: "",
      createdAt: "",
    },
    updatedAt: "",
    createdAt: "",
    ...overrides,
  };
}

describe("ProjectCard", () => {
  it("links to the project detail page and renders title + location", () => {
    const html = renderToString(<ProjectCard project={project()} />);
    expect(html).toContain('href="/projects/keewatin-feature-wall"');
    expect(html).toContain("Keewatin Feature Wall");
    expect(html).toContain("Winnipeg, MB");
    expect(html).toContain("Residential");
    expect(html).toContain("%2Fmedia%2Fhero.webp");
  });

  it("falls back to the gallery when heroImage is unset", () => {
    const p = project({ heroImage: null });
    p.gallery = [
      { id: 3, url: "/media/gallery.webp", alt: "Gallery shot", updatedAt: "", createdAt: "" },
    ];
    const html = renderToString(<ProjectCard project={p} />);
    expect(html).toContain("%2Fmedia%2Fgallery.webp");
  });

  it("falls back to the after image when hero and gallery are unset", () => {
    const p = project({ heroImage: null });
    p.afterImage = { id: 4, url: "/media/after.webp", alt: "", updatedAt: "", createdAt: "" };
    const html = renderToString(<ProjectCard project={p} />);
    expect(html).toContain("%2Fmedia%2Fafter.webp");
  });
});
