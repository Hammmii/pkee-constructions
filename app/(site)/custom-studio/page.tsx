import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CapabilityGallery,
  type StudioCapability,
} from "@/components/custom-studio/CapabilityGallery";
import { CustomStudioWizard } from "@/components/custom-studio/CustomStudioWizard";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ProjectBeforeAfter } from "@/components/projects/ProjectBeforeAfter";
import { FALLBACK_BASE_MATERIALS } from "@/lib/customStudio";
import { getPayloadCached } from "@/lib/payload";
import type { Media, Product, ProductCategory, Project } from "@/payload-types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Custom Studio",
    description:
      "Upload your design and PKEE Constructions fabricates it — feature walls, custom doors and cabinets, mandir and darbar, 3D parametric relief, custom stone, and backlit panels. Designed and installed in Winnipeg, MB.",
  };
}

/** Static capability copy; imagery resolved from ProductCategories below. */
const CAPABILITY_DEFS: Array<{
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  categorySlugs: string[];
}> = [
  {
    slug: "feature-walls",
    title: "Feature Walls",
    eyebrow: "Signature",
    description:
      "Panels, stone, and lighting composed as one system. Our designers lay out the full wall — material, pattern, joints, and light — then our fabricators and installers deliver it as a single finished piece.",
    categorySlugs: ["feature-walls", "pvc-wall-panels"],
  },
  {
    slug: "custom-doors",
    title: "Doors & Cabinets",
    eyebrow: "Refaced",
    description:
      "Existing frames transformed — stone, louver, fluted, or 3D faces matched to your walls. A kitchen or vanity re-faced in our materials reads like a full millwork replacement, at a fraction of the disruption.",
    categorySlugs: ["custom-doors"],
  },
  {
    slug: "mandir-darbar",
    title: "Mandir & Darbar",
    eyebrow: "Handcrafted",
    description:
      "Carved stone sanctuaries and darbar feature walls with integrated lighting, shelving, and storage. Each piece is laid out with your family, fabricated in our shop, and installed as the room's focal point.",
    categorySlugs: ["mandir-darbar"],
  },
  {
    slug: "3d-parametric",
    title: "3D Parametric",
    eyebrow: "CNC-cut",
    description:
      "Computational relief patterns cut precisely to your wall's dimensions — waves, ripples, and geometric fields in WPC, charcoal, or stone composites. Scaled from your drawing, finished in your colour.",
    categorySlugs: ["3d-parametric"],
  },
  {
    slug: "custom-stone",
    title: "Custom Stone",
    eyebrow: "Fabricated",
    description:
      "HD stone, nano stone, and crystalline stone cut and finished to order — fireplace surrounds, counters, columns, and wall cladding with book-matched veining and concealed fixings.",
    categorySlugs: ["hd-stone", "faux-nano-stone", "faux-crystalline-stone", "artificial-stone"],
  },
  {
    slug: "backlit-panels",
    title: "Backlit Panels",
    eyebrow: "Integrated light",
    description:
      "Translucent panels on integrated LED profiles — warm, even glow behind onyx-look stone, crystalline, or printed decor sheets. The lighting system is engineered with the panel, not retrofitted after.",
    categorySlugs: ["led-profiles", "customized-decor-sheet"],
  },
];

const PROCESS_STEPS: Array<[string, string]> = [
  [
    "Upload",
    "Send your sketch, photo, or inspiration through the request form below — five short steps.",
  ],
  [
    "Design",
    "Our studio turns it into a working drawing: materials, finishes, dimensions, and lighting.",
  ],
  [
    "Fabricate",
    "Cut and finished in our shop, inspected against the drawing before it leaves the bench.",
  ],
  [
    "Install",
    "Our installers set the finished piece — supplied, fabricated, and installed by one team.",
  ],
];

function isPopulated<T>(value: number | T | null | undefined): value is T {
  return typeof value === "object" && value !== null;
}

/** Distinct material values from published Products — drives the wizard's base-material select. */
async function listBaseMaterials(): Promise<string[]> {
  try {
    const payload = await getPayloadCached();
    const { docs } = await payload.find({
      collection: "products",
      where: { material: { not_equals: null } },
      limit: 100,
    });
    const materials = new Set<string>();
    for (const product of docs as Product[]) {
      const material = product.material?.trim();
      if (material) materials.add(material);
    }
    return materials.size > 0 ? [...materials].sort() : [...FALLBACK_BASE_MATERIALS];
  } catch {
    return [...FALLBACK_BASE_MATERIALS];
  }
}

async function getCapabilities(): Promise<StudioCapability[]> {
  let categories: ProductCategory[] = [];
  try {
    const payload = await getPayloadCached();
    const result = await payload.find({ collection: "product-categories", limit: 100, depth: 1 });
    categories = result.docs as ProductCategory[];
  } catch {
    categories = [];
  }

  return CAPABILITY_DEFS.map((def) => {
    const category = def.categorySlugs
      .map((slug) => categories.find((candidate) => candidate.slug === slug))
      .find((candidate) => candidate !== undefined);
    const hero = category && isPopulated<Media>(category.heroImage) ? category.heroImage : null;
    return {
      slug: def.slug,
      title: def.title,
      eyebrow: def.eyebrow,
      description: def.description,
      image: hero?.url
        ? { url: hero.url, alt: hero.alt ?? `${def.title} — PKEE Constructions Custom Studio` }
        : null,
    };
  });
}

/** One published project with a real before/after pair — drives the transformation slider. */
async function findBeforeAfterProject(): Promise<Project | null> {
  try {
    const payload = await getPayloadCached();
    const { docs } = await payload.find({
      collection: "projects",
      where: {
        and: [
          { _status: { equals: "published" } },
          { beforeImage: { exists: true } },
          { afterImage: { exists: true } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    });
    return (docs[0] as Project | undefined) ?? null;
  } catch {
    return null;
  }
}

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Custom Studio — PKEE Constructions",
    description:
      "Upload your design and PKEE Constructions fabricates it — feature walls, custom doors and cabinets, mandir and darbar, 3D parametric relief, custom stone, and backlit panels.",
    url: "https://www.pkeeconstructions.ca/custom-studio",
    isPartOf: { "@type": "WebSite", name: "PKEE Constructions" },
    about: {
      "@type": "LocalBusiness",
      name: "PKEE Constructions",
      address: {
        "@type": "PostalAddress",
        streetAddress: "360 Keewatin St",
        addressLocality: "Winnipeg",
        addressRegion: "MB",
        addressCountry: "CA",
      },
    },
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.pkeeconstructions.ca" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Custom Studio",
        item: "https://www.pkeeconstructions.ca/custom-studio",
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD structured data.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD structured data.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  );
}

export default async function CustomStudioPage() {
  const [capabilities, materials, beforeAfterProject] = await Promise.all([
    getCapabilities(),
    listBaseMaterials(),
    findBeforeAfterProject(),
  ]);

  return (
    <div className="flex-1 bg-background">
      <JsonLd />

      {/* Editorial hero */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 md:px-10 md:pt-28">
        <p className="text-label text-brass">Custom Studio</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl italic text-ink md:text-6xl">
          Your design, <em className="font-accent">fabricated.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-foreground/60">
          Bring us a sketch, a photo, or just an idea. The PKEE Custom Studio designs, fabricates,
          and installs one-of-a-kind pieces in PVC, WPC, stone, and light — from 360 Keewatin St,
          Winnipeg, into homes and businesses across Manitoba.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#upload"
            className="inline-flex h-14 items-center rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors hover:bg-charcoal"
          >
            Upload your design
          </a>
          <Link
            href="/consultation?type=showroom"
            className="inline-flex h-14 items-center rounded-[2px] border border-stone px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
          >
            Book a designer
          </Link>
        </div>
      </section>

      {/* Atmospheric hero image (placeholder-safe) */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20 md:px-10">
        <ImageReveal className="aspect-[16/9]">
          {capabilities[0]?.image ? (
            <Image
              src={capabilities[0].image.url}
              alt={capabilities[0].image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 60rem, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-charcoal" aria-hidden="true" />
          )}
        </ImageReveal>
      </section>

      <CapabilityGallery capabilities={capabilities} />

      {/* Process */}
      <section className="border-t rule">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 md:px-10 md:py-28">
          <p className="text-label text-brass">Process</p>
          <h2 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
            From drawing to <em className="font-accent">installed.</em>
          </h2>
          <dl className="mt-12">
            {PROCESS_STEPS.map(([label, value], index) => (
              <div
                key={label}
                className="grid gap-2 border-t py-6 rule sm:grid-cols-12 sm:items-baseline"
              >
                <dt className="text-label text-brass sm:col-span-2">
                  {String(index + 1).padStart(2, "0")} — {label}
                </dt>
                <dd className="text-foreground/75 sm:col-span-10">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Raw wall → finished feature wall (skipped when no seeded pair) */}
      {beforeAfterProject ? (
        <ProjectBeforeAfter
          project={{
            title: beforeAfterProject.title,
            slug: beforeAfterProject.slug,
            location: beforeAfterProject.location,
            beforeImage:
              typeof beforeAfterProject.beforeImage === "object"
                ? beforeAfterProject.beforeImage
                : null,
            afterImage:
              typeof beforeAfterProject.afterImage === "object"
                ? beforeAfterProject.afterImage
                : null,
          }}
        />
      ) : null}

      {/* Upload wizard */}
      <section id="upload" className="border-t rule scroll-mt-24">
        <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
          <p className="text-label text-brass">Upload Your Design</p>
          <h2 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
            Five steps. One form.
          </h2>
          <p className="mt-4 max-w-xl text-foreground/60">
            Tell us the material, the finish, and the shape of the piece — attach a reference if you
            have one. Every request is reviewed by a person on the design team, and we respond
            within 2 business days. No pricing is published online; every custom piece is quoted.
          </p>

          <div className="mt-12">
            <CustomStudioWizard
              materials={materials}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
            />
          </div>
        </div>
      </section>

      {/* Designer CTA */}
      <section className="border-t rule">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10">
          <h2 className="text-label text-ink/55">Prefer to design together?</h2>
          <p className="mt-4 text-foreground/80">
            Book a showroom consultation — 360 Keewatin St, Winnipeg, MB — and sit down with a
            designer over samples, swatches, and finishes.
          </p>
          <Link
            href="/consultation?type=showroom"
            className="mt-10 inline-flex h-14 items-center rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors hover:bg-charcoal"
          >
            Book a designer
          </Link>
        </div>
      </section>
    </div>
  );
}
