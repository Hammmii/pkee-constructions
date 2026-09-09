/**
 * Plain prop contracts for the M4 home-page sections.
 *
 * The server page (app/page.tsx) maps Payload documents (depth 1) into these
 * shapes so sections stay free of CMS imports and render from plain data.
 */

export type HomeMedia = {
  url: string | null;
  alt: string;
  width?: number | null;
  height?: number | null;
} | null;

export type CategoryCard = {
  name: string;
  slug: string;
  intro: string | null;
  image: HomeMedia;
};

export type SpaceTile = {
  name: string;
  slug: string;
  image: HomeMedia;
};

export type FeaturedProduct = {
  name: string;
  slug: string;
  summary: string | null;
  /** Fully-resolved route, e.g. /products/pvc-wall-panels/fluted-slat-pvc-panel */
  href: string;
  image: HomeMedia;
};

export type ProjectItem = {
  title: string;
  slug: string;
  location: string | null;
  type: "residential" | "commercial" | null;
  href: string;
  image: HomeMedia;
  beforeImage: HomeMedia;
  afterImage: HomeMedia;
  /** First gallery image, used by the craft/process scrub. */
  detailImage: HomeMedia;
};

export type TestimonialItem = {
  name: string;
  rating: number;
  text: string;
  location: string | null;
  verified: boolean;
};

export type StatItem = {
  label: string;
  value: string;
};

export type CapabilityCard = {
  title: string;
  description: string;
  image: HomeMedia;
};
